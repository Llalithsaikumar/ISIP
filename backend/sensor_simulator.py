"""
Industrial Sensor Telemetry Simulator — Industrial Safety Intelligence Platform (ISIP)

This script simulates real-time industrial sensor feeds and operational telemetry,
periodically sending it to the FastAPI /predict endpoint. It includes:
    - Thread-safe class design for start/stop and runtime interval updates
    - Custom scenario generators representing normal operation and diverse hazard types
    - Beautiful ASCII logging layout suited for Windows command-line displays
    - Interactive command shell for runtime control of simulation features
"""

import os
import sys
import time
import random
import argparse
import threading
from typing import Dict, Any, Optional

import httpx

# Ensure backend package is in system path for direct executions
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
if PARENT_DIR not in sys.path:
    sys.path.append(PARENT_DIR)

# Attempt structured logging import; fallback to basic log if run outside backend context
try:
    from backend.utils.logging import logger
except ImportError:
    import logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    logger = logging.getLogger("sensor_simulator")


class SensorSimulator:
    """
    Thread-safe continuous industrial telemetry simulator.
    Can run in a background daemon thread, allowing interactive CLI controls
    or embedding into other application entrypoints.
    """

    def __init__(self, api_url: str = "http://localhost:8000/predict", interval: float = 5.0, seed: Optional[int] = None):
        self.api_url = api_url
        self._interval = interval
        
        if seed is not None:
            random.seed(seed)

        # Thread synchronization primitives
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._running = False

        # Forced scenario trigger queue
        self._next_scenario: Optional[str] = None
        
        # Statistics trackers
        self.total_payloads_sent = 0
        self.total_failures = 0

    @property
    def interval(self) -> float:
        """Thread-safe getter for simulation interval."""
        with self._lock:
            return self._interval

    @interval.setter
    def interval(self, val: float) -> None:
        """Thread-safe setter for simulation interval."""
        if val <= 0.1:
            raise ValueError("Interval must be greater than 0.1 seconds")
        with self._lock:
            self._interval = val
            logger.info(f"Simulator interval updated to {val:.2f} seconds.")

    @property
    def is_running(self) -> bool:
        """Thread-safe status check."""
        with self._lock:
            return self._running

    def start(self) -> bool:
        """
        Starts the simulation loop in a background thread if it is not already running.
        Returns True if started successfully, False otherwise.
        """
        with self._lock:
            if self._running:
                logger.warning("Simulator is already running.")
                return False

            self._stop_event.clear()
            self._running = True
            self._thread = threading.Thread(target=self._run_loop, daemon=True)
            self._thread.start()
            logger.info("Simulator background thread spawned successfully.")
            return True

    def stop(self) -> bool:
        """
        Signals the background thread to stop and blocks until it terminates.
        Returns True if stopped successfully.
        """
        with self._lock:
            if not self._running:
                logger.warning("Simulator is not currently running.")
                return False

            logger.info("Stopping simulator background thread...")
            self._stop_event.set()
            self._running = False

        # Wait for thread termination outside the lock to prevent deadlocks
        if self._thread:
            self._thread.join(timeout=3.0)
            self._thread = None
            
        logger.info("Simulator background thread stopped.")
        return True

    def trigger_scenario(self, scenario_name: str) -> bool:
        """
        Queues a specific dangerous scenario or returns to normal.
        Allowed values: 'normal', 'gas_leak', 'vibration_fatigue', 'ppe_violation', 'anomaly_spike'
        """
        valid_scenarios = {"normal", "gas_leak", "vibration_fatigue", "ppe_violation", "anomaly_spike"}
        if scenario_name not in valid_scenarios:
            logger.warning(f"Unknown scenario target: '{scenario_name}'. Valid choices: {list(valid_scenarios)}")
            return False
            
        with self._lock:
            self._next_scenario = scenario_name
            logger.info(f"Queued manual scenario trigger: [{scenario_name.upper()}] for next telemetry cycle.")
            return True

    def generate_payload(self) -> Dict[str, Any]:
        """
        Creates a telemetry reading payload based on normal operation
        or queued/weighted dangerous industrial scenarios.
        """
        with self._lock:
            scenario = self._next_scenario
            self._next_scenario = None

        # If no manual override is active, roll random chance: 80% Normal, 20% Danger splits
        if not scenario:
            scenario = random.choices(
                ["normal", "gas_leak", "vibration_fatigue", "ppe_violation", "anomaly_spike"],
                weights=[0.80, 0.05, 0.05, 0.05, 0.05],
                k=1
            )[0]

        shift = random.choice(["day", "night"])

        if scenario == "normal":
            temperature = random.uniform(25.0, 65.0)
            gas_level = random.uniform(2.0, 20.0)
            humidity = random.uniform(35.0, 75.0)
            vibration = random.uniform(5.0, 30.0)
            worker_count = random.randint(2, 18)
            ppe_compliance = random.choices([1, 0], weights=[0.95, 0.05], k=1)[0]
            description = "Normal Operating Conditions"
            
        elif scenario == "gas_leak":
            # Synergy risk: High Gas + High Temp
            temperature = random.uniform(80.0, 115.0)
            gas_level = random.uniform(70.0, 95.0)
            humidity = random.uniform(20.0, 50.0)
            vibration = random.uniform(10.0, 45.0)
            worker_count = random.randint(10, 30)
            ppe_compliance = random.choices([1, 0], weights=[0.90, 0.10], k=1)[0]
            description = "DANGER: Gas Leak Synergy (Combustion / Toxic Threat)"

        elif scenario == "vibration_fatigue":
            # High Vibration + Temperature build-up
            temperature = random.uniform(85.0, 110.0)
            gas_level = random.uniform(5.0, 35.0)
            humidity = random.uniform(40.0, 70.0)
            vibration = random.uniform(75.0, 98.0)
            worker_count = random.randint(15, 45)
            ppe_compliance = random.choices([1, 0], weights=[0.85, 0.15], k=1)[0]
            description = "DANGER: Heavy Machinery Vibration Fatigue & Overheating"

        elif scenario == "ppe_violation":
            # PPE Non-compliant under standard night shift operations
            temperature = random.uniform(40.0, 70.0)
            gas_level = random.uniform(15.0, 40.0)
            humidity = random.uniform(40.0, 75.0)
            vibration = random.uniform(15.0, 45.0)
            worker_count = random.randint(25, 50)
            ppe_compliance = 0  # Severe non-compliance
            shift = "night"
            description = "DANGER: Night Shift Operations with Severe PPE Violations"

        elif scenario == "anomaly_spike":
            # Trigger values optimized to test IsolationForest out-of-bounds alerts
            temperature = random.uniform(115.0, 120.0)
            gas_level = random.uniform(95.0, 100.0)
            humidity = random.uniform(90.0, 100.0)
            vibration = random.uniform(95.0, 100.0)
            worker_count = random.randint(40, 50)
            ppe_compliance = 0
            description = "DANGER: Out-of-bounds Extreme Multi-Sensor Telemetry Anomaly"
        
        else:
            # Fallback
            temperature = 30.0
            gas_level = 5.0
            humidity = 50.0
            vibration = 10.0
            worker_count = 5
            ppe_compliance = 1
            description = "Normal (Fallback)"

        # Strictly enforce Pydantic boundaries
        temperature = max(20.0, min(120.0, temperature))
        gas_level = max(0.0, min(100.0, gas_level))
        humidity = max(10.0, min(100.0, humidity))
        vibration = max(0.0, min(100.0, vibration))
        worker_count = max(1, min(50, worker_count))

        payload = {
            "temperature": round(temperature, 2),
            "gas_level": round(gas_level, 2),
            "humidity": round(humidity, 2),
            "vibration": round(vibration, 2),
            "worker_count": int(worker_count),
            "shift": shift,
            "ppe_compliance": int(ppe_compliance)
        }

        return {
            "payload": payload,
            "scenario": scenario,
            "description": description
        }

    def _run_loop(self) -> None:
        """Continuous internal loop calling `/predict` endpoint."""
        logger.info(f"Simulator starting continuous feed targeting: {self.api_url}")
        
        # Instantiate persistent client for keep-alive connections
        with httpx.Client(timeout=4.0) as client:
            while not self._stop_event.is_set():
                sim_data = self.generate_payload()
                payload = sim_data["payload"]
                scenario_desc = sim_data["description"]
                scenario_type = sim_data["scenario"]

                # Console representation header
                print("\n" + "-" * 70)
                print(f"[TELEMETRY SEND] Scenario: {scenario_type.upper()}")
                print(f"Details: {scenario_desc}")
                print("-" * 70)
                
                # Tabular details
                print(f"  * Temp        : {payload['temperature']:.2f} C")
                print(f"  * Gas Level   : {payload['gas_level']:.2f} ppm")
                print(f"  * Humidity    : {payload['humidity']:.2f}%")
                print(f"  * Vibration   : {payload['vibration']:.2f} mm/s")
                print(f"  * Workers     : {payload['worker_count']}")
                print(f"  * Shift       : {payload['shift']}")
                print(f"  * PPE Status  : {'COMPLIANT' if payload['ppe_compliance'] == 1 else 'VIOLATION'}")
                print("-" * 70)

                try:
                    # POST request to prediction endpoint
                    response = client.post(self.api_url, json=payload)
                    
                    if response.status_code == 200:
                        res_data = response.json()
                        self.total_payloads_sent += 1
                        
                        # Display returned metrics cleanly
                        print("[PREDICTION RECEIVED]")
                        print(f"  * RF Regressor Risk Score : {res_data['predicted_risk']:.2f}/100")
                        print(f"  * IsolationForest Anomaly : {res_data['anomaly_risk']:.2f}/100")
                        print(f"  * Blended Composite Risk  : {res_data['final_risk']:.2f}/100")
                        
                        # Map risk levels to visual ASCII status tags (No unicode emoji to ensure Windows cmd safety)
                        risk_level = res_data["risk_level"].upper()
                        if risk_level == "CRITICAL":
                            status_tag = "[!!! CRITICAL ALERT !!!]"
                        elif risk_level == "HIGH":
                            status_tag = "[!! HIGH RISK !!]"
                        elif risk_level == "MEDIUM":
                            status_tag = "[! MODERATE RISK !]"
                        else:
                            status_tag = "[ SAFE / LOW RISK ]"
                            
                        print(f"  * CLASSIFICATION STATUS   : {status_tag}")
                    else:
                        self.total_failures += 1
                        print(f"[API ERROR] Request failed with status code {response.status_code}")
                        print(f"Response: {response.text}")
                        
                except httpx.RequestError as exc:
                    self.total_failures += 1
                    print(f"[CONNECTION ERROR] Failed to connect to FastAPI endpoint at {self.api_url}")
                    print(f"Details: {exc}")

                print("-" * 70)

                # Fetch current sleep duration within lock in case it changes
                sleep_time = self.interval
                
                # Check stop_event in smaller increments (0.1s) for responsive stops
                elapsed = 0.0
                while elapsed < sleep_time:
                    if self._stop_event.is_set():
                        break
                    time.sleep(0.1)
                    elapsed += 0.1


def main():
    """Main CLI and interactive control loop driver."""
    parser = argparse.ArgumentParser(description="Industrial Safety Simulator Command Line Utility")
    parser.add_argument("--url", type=str, default="http://localhost:8000/predict", help="FastAPI predict URL endpoint")
    parser.add_argument("--interval", type=float, default=5.0, help="Query frequency interval in seconds")
    parser.add_argument("--seed", type=int, default=None, help="Random number generator seed")
    parser.add_argument("--continuous", action="store_true", help="Start continuous simulation loop immediately without shell prompt")

    args = parser.parse_args()

    simulator = SensorSimulator(api_url=args.url, interval=args.interval, seed=args.seed)

    # Continuous execution mode
    if args.continuous:
        logger.info("Continuous mode activated. Starting simulator...")
        simulator.start()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("KeyboardInterrupt caught. Stopping simulator...")
            simulator.stop()
            sys.exit(0)

    # Interactive CLI Shell Mode
    print("=" * 70)
    print("   ISIP TELEMETRY SIMULATOR SHELL INTERFACE")
    print("=" * 70)
    print(" Available commands:")
    print("   start             - Starts the background telemetry simulator thread")
    print("   stop              - Suspends the simulator thread")
    print("   interval <secs>   - Changes the queries interval speed (e.g. 'interval 2.5')")
    print("   trigger <type>    - Forces specific scenario for next telemetric cycle")
    print("                       Scenarios: gas_leak, vibration_fatigue, ppe_violation, anomaly_spike, normal")
    print("   status            - Displays current thread loop diagnostics & status")
    print("   help              - Prints command list")
    print("   exit / quit       - Closes simulator completely")
    print("=" * 70)

    # Start the simulator automatically on shell startup
    simulator.start()

    while True:
        try:
            user_input = input("simulator> ").strip().lower()
            if not user_input:
                continue

            parts = user_input.split()
            cmd = parts[0]

            if cmd in ("exit", "quit"):
                simulator.stop()
                print("Exiting simulator shell. Goodbye.")
                break

            elif cmd == "help":
                print("Commands: start, stop, interval <val>, trigger <gas_leak|vibration_fatigue|ppe_violation|anomaly_spike|normal>, status, help, exit")

            elif cmd == "start":
                started = simulator.start()
                if started:
                    print("Simulator background execution resumed.")
                else:
                    print("Simulator is already running.")

            elif cmd == "stop":
                stopped = simulator.stop()
                if stopped:
                    print("Simulator background execution suspended.")
                else:
                    print("Simulator was not running.")

            elif cmd == "interval":
                if len(parts) < 2:
                    print("Error: Specify a numeric duration in seconds. Example: 'interval 2.5'")
                    continue
                try:
                    seconds = float(parts[1])
                    simulator.interval = seconds
                    print(f"Simulation interval successfully configured to: {seconds}s")
                except ValueError:
                    print("Error: Invalid numeric value for interval.")

            elif cmd == "trigger":
                if len(parts) < 2:
                    print("Error: Specify scenario name (normal, gas_leak, vibration_fatigue, ppe_violation, anomaly_spike)")
                    continue
                scenario = parts[1]
                triggered = simulator.trigger_scenario(scenario)
                if triggered:
                    print(f"Manual override scheduled: Next cycle will simulate [{scenario.upper()}]")
                else:
                    print("Error: Check spelling of scenario name.")

            elif cmd == "status":
                running_status = "RUNNING" if simulator.is_running else "STOPPED"
                print("\n--- Simulator Diagnostics ---")
                print(f"  * Status            : {running_status}")
                print(f"  * Query Target URL  : {simulator.api_url}")
                print(f"  * Sleep Interval    : {simulator.interval} seconds")
                print(f"  * Telemetry Cycles  : {simulator.total_payloads_sent} successfully sent")
                print(f"  * Connection Errors : {simulator.total_failures} failures recorded")
                print("-" * 30 + "\n")

            else:
                print(f"Unknown command: '{cmd}'. Type 'help' for command reference.")

        except (KeyboardInterrupt, EOFError):
            print("\nShutting down telemetry feeds...")
            simulator.stop()
            break


if __name__ == "__main__":
    main()
