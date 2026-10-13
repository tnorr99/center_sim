# MISSION OBJECTIVE
You are an autonomous engineering team tasked with building a responsive, drag-and-drop data center thermodynamics simulation. The tech stack is React, dnd-kit, and D3.js. 

You will operate as five distinct agents. Do not break character. The Project Manager (Agent 5) is the orchestrator and will dictate the sequence of operations. You must complete the task sequentially, creating, modifying, and testing actual files in the workspace.

## THE AGENTS & SEQUENCE

### Step 1: Agent 5 (Project Manager) - Initialization
* **Role:** Orchestrator and Quality Assurance.
* **Task:** Initialize a standard React/Vite project if one does not exist. Create the folder structure (`/src/data`, `/src/logic`, `/src/components`, `/src/tests`). Once the environment is ready, hand off to the Researcher.

### Step 2: Agent 1 (The Researcher)
* **Role:** Data Aggregator and Formatter.
* **Task:** Create a `/src/data/constants.json` file. This must contain structured data for the simulation based on these known real-world parameters:
  - **Environment:** McLean, VA (Summer Peak: 30.5°C, Winter Trough: -2.2°C).
  - **Facility:** 100 MW capacity, Loudoun County baseline.
  - **Hardware:** NVIDIA GB200 NVL72 Racks (120kW power, 120kW heat output, liquid cooling required).
  - **Cooling Tech Matrix:** Standard CRAC (High PUE, high temp sensitivity), Hot-Aisle Containment (Medium PUE), Direct-to-Chip Liquid Cooling (Low PUE ~1.05, low temp sensitivity).
* **Output:** A strict, well-typed JSON or TypeScript file exporting these constants. Handoff to Backend Developer.

### Step 3: Agent 2 (The Backend Developer)
* **Role:** State Management and Thermodynamic Logic.
* **Task:** - Locate the `reference_thermoCalc.ts` file in the root directory. 
  - Move this file to `/src/logic/thermoCalc.ts`. **Do not alter the mathematical formulas in this file.** It contains the verified PUE curves and heat rejection math.
  - Create a React Context or Zustand store (`/src/logic/store.ts`).
  - Wire the store to use the functions exported from `thermoCalc.ts`. The store must hold the state of an array of "Rack" objects and the current "Outside Temperature", and expose the calculated `systemPUE` and `heatRejectedMW`.
* **Output:** A globally accessible state store wired to the verified math. Handoff to Frontend Developer.

### Step 4: Agent 3 (The Frontend Developer)
* **Role:** UI, Interaction, and Data Visualization.
* **Task:** Build the user interface. 
  - Use `dnd-kit` to create a "Cooling Module Palette" and a "Data Center Floor" drop zone.
  - Ensure dropping a module updates the global state via the Backend Developer's store.
  - Use `D3.js` to create a reactive visualizer (e.g., a simple heat map grid or dynamic gauge charts) that listens to the thermodynamic output and visually updates when the PUE or heat rejection changes.
* **Output:** The complete React component tree. Handoff to the Tester.

### Step 5: Agent 4 (The Tester)
* **Role:** Quality Assurance and Edge Case Verification.
* **Task:** Create `/src/tests/thermoCalc.test.ts` (using Jest/Vitest).
  - Write unit tests verifying that swapping a CRAC unit for a Direct-to-Chip module mathematically reduces the PUE and heat output in the logic layer.
  - Write tests to ensure summer temperatures (30.5°C) accurately degrade the efficiency of air-cooled modules compared to winter temperatures.
* **Output:** Passing test suites. Handoff back to Project Manager.

### Step 6: Agent 5 (Project Manager) - Final Review
* **Task:** Run the test suite. Review the component wiring. Ensure the simulation successfully allows a user to drag a cooling method onto a data center rack and see an immediate, mathematically sound change in heat and energy output. Provide a final summary of the architecture.

# EXECUTION
Begin execution immediately, starting with Agent 5 initializing the workspace. Detail your terminal commands, file creations, and reasoning as you move through the steps.