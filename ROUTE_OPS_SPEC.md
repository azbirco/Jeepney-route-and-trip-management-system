# RouteOps.NV
## Jeepney Route and Trip Management System
> **Tagline:** Plan Routes. Manage Trips. Monitor Operations.

---

## 1. System Identity, Purpose & Scope

### System Identity
* **System Name:** `RouteOps.NV`
* **Official Title:** Jeepney Route and Trip Management System
* **Primary Visual Vibe:** Modern Transportation Dashboard with a Dark Theme, Glassmorphism elements, Bento Grid layout, and high-visibility Orange (#F97316) primary accents.

### Purpose
`RouteOps.NV` is a specialized, terminal-centric software designed specifically to support transportation personnel and administrators in planning, organizing, monitoring, and evaluating jeepney operations. It streamlines terminal dispatching and dispatch statistics to ensure organized schedules and reliable tracking.

### System Scope Boundary
* **IN-SCOPE (Core Operations):**
  * Jeepney Registry & Availability tracking
  * Municipality-to-Municipality Route planning & Fare configuration
  * Master Schedule configuration (Departure/Arrival windows)
  * Real-time Trip Dispatch & Monitoring (Scheduled → Boarding → In Transit → Completed/Cancelled)
  * Terminal Passenger Statistics & occupancy logging
  * Operational reporting and revenue estimations for analytics
  * Admin Synchronization with centralized cloud registers
* **OUT-OF-SCOPE (Strictly Prohibited from Implementation):**
  * Passenger Bookings or Reservations
  * Ticketing and boarding passes
  * Online Payments or Fare collection
  * Hardware-based GPS/Vehicle tracking
  * Driver Payroll and scheduling integrations
  * Vehicle Maintenance, Parts, and Garage monitoring
  * Fuel tracking and monitoring

---

## 2. User Roles & Responsibilities

### 2.1 Admin (Oversight and Monitoring Only)
* **Personnel Management:** Create, edit, activate, and deactivate transportation personnel accounts. Reset passwords.
* **Dashboard Analytics:** Monitor system-wide operations, total passengers, estimated revenues, and active terminal statuses.
* **Configuration Controls:** Set up primary configuration parameters (municipality list, core fare factors).
* **System Logs & Sync:** View synchronization logs, verify centralized API connection status, and inspect detailed system activity trails.

### 2.2 Transportation Personnel (Daily Terminal Operations)
* **Jeepney Registry:** Manage individual jeepney assets, verify capacity, and update status (Available, In Transit, Inactive).
* **Route Setup:** Input municipality-to-municipality route definitions, estimated runtimes, and baseline fares.
* **Schedule Planning:** Establish routine departure slots.
* **Trip Lifecycle Management:** Dispatch trips, assign available jeepneys, transition trips through statuses (Scheduled → Boarding → In Transit → Completed/Cancelled).
* **Passenger Logging:** Manually input precise passenger counts for completed trips.
* **Terminal Sync:** Upload local terminal reports and transaction records to the centralized Admin system.

---

## 3. Operational Workflow

```
[ Login ]
   │
   ▼
[ Dashboard Overview ] (Transportation Personnel or Admin view)
   │
   ├─► [ Manage Jeepneys ] ──► (Register vehicles and verify "Available" status)
   │
   ├─► [ Manage Routes ] ────► (Configure origin/destination paths and set fares)
   │
   └─► [ Configure Schedules ] ──► (Set designated departure times on routes)
         │
         ▼
   [ Create Trip ] ──────────► (Initialize a trip utilizing a pre-set Route + Schedule)
         │
         ▼
   [ Assign Jeepney ] ───────► (Bind an "Available" jeepney to the initialized trip)
         │
         ▼
   [ Update Trip Status ]
         │
         ├─► [ Boarding ] ───► (Passengers board; limit occupancy by vehicle capacity)
         │
         ├─► [ In Transit ] ─► (Jeepney departs; status set to "In Transit"; locked from other trips)
         │
         ├─► [ Completed ] ──► (Trip ends; status "Completed"; Jeepney returns to "Available" state)
         │     │
         │     └─► [ Record Passenger Statistics ] ──► (Log final passenger totals & calculate revenue)
         │           │
         │           └─► [ Generate Reports ] ───────► (Compile daily terminal operation summary)
         │                 │
         │                 └─► [ Synchronize Statistics ] ──► [ Admin System / Main database ]
         │
         └─► [ Cancelled ] ──► (Trip terminated before departure; Jeepney set back to "Available")
```

---

## 4. Module Relationships

* **Route:** The physical link between two municipalities defining distance, base fare, and travel times.
* **Schedule:** A time-slot template tied to a specific Route (e.g., Solano to Bayombong at 08:30 AM).
* **Jeepney:** A registered vehicle asset with specific capacity limits, type, plate number, and status.
* **Trip:** The operational instance matching:
  $$\text{Trip} = 1 \times \text{Jeepney} + 1 \times \text{Route} + 1 \times \text{Schedule}$$
* **Passenger Statistics:** Recorded at the boarding/completion of a **Trip** based on the actual count, used for occupancy rate and revenue metrics.
* **Reports:** Aggregated collections of Trips, Passenger Statistics, and Estimated Revenues.
* **Synchronization:** The pipeline that processes and transmits offline/local transaction logs and summaries up to the central database.

---

## 5. Detailed Trip Lifecycle

```
                     ┌──────────────────┐
                     │    Scheduled     │
                     └────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
           ┌────────────────┐   ┌───────────────┐
           │    Boarding    │   │   Cancelled   │
           └────────┬───────┘   └───────┬───────┘
                    │                   │
                    ▼                   │ (Reverts Jeepney
           ┌────────────────┐           │  to 'Available')
           │   In Transit   │           │
           └────────┬───────┘           │
                    │                   │
                    ▼                   ▼
           ┌────────────────┐     ┌───────────┐
           │   Completed    │     │ Terminated│
           └────────┬───────┘     └───────────┘
                    │
                    ▼
       [ Log Passenger Stats & ]
       [   Revert Jeepney status   ]
```

---

## 6. Business Rules & Operational Constraints

1. **Asset Exclusivity:** A Jeepney can only be assigned to a Trip if its status is `Available`. While a Trip is in `Boarding` or `In Transit` states, the assigned Jeepney is locked (`In Transit` status) and cannot be assigned to any other active trips.
2. **Capacity Ceiling:** The Passenger Count recorded for a Trip can never exceed the maximum vehicle capacity of the assigned Jeepney.
3. **Route Uniqueness:** Duplicate routes (having identical Origin and Destination) are prohibited.
4. **Self-Loop Prevention:** A Route's Origin and Destination municipalities cannot be identical.
5. **Plate Number Uniqueness:** Plate numbers are checked against regex patterns (`AAA-1234` or `AA-12345`) and must be globally unique.
6. **Schedule Prerequisites:** A Trip cannot be created ad-hoc; it must bind directly to an existing, active Route Schedule slot.
7. **Analytical Revenue Model:** Revenue is calculated strictly for analytical dashboard visualizers:
   $$\text{Estimated Revenue} = \text{Passenger Count} \times \text{Estimated Route Fare}$$
   No actual payment or digital wallet integrations exist.
8. **Stat Recovery on Cancellation:** If a Trip transitions to `Cancelled`, the assigned Jeepney must immediately revert to `Available`, and any allocated resources are released.

---

## 7. Validation Rules Matrix

| Module | Target Action | Field | Validation Rule | Error Message Triggered |
| :--- | :--- | :--- | :--- | :--- |
| **Jeepney** | Add / Edit | Plate Number | Must be unique; Match pattern `/^[A-Z]{2,3}-\d{4,5}$/` | "Invalid Plate Number format. Use AAA-1234 or AA-12345." |
| | | Capacity | Range: integer from 10 to 35 | "Capacity must be an integer between 10 and 35." |
| | | Type | Must be one of: `Traditional Jeepney`, `E-Jeep` | "Please select a valid Jeepney Type." |
| **Route** | Add / Edit | Origin & Dest | Must be selected from the authorized municipality list | "Please select a valid municipality." |
| | | Origin vs. Dest | Origin must NOT equal Destination | "Origin and Destination municipalities cannot be identical." |
| | | Estimated Fare | Minimum value: ₱15.00, numeric | "Estimated fare must be at least ₱15.00." |
| | | Travel Time | Minimum value: 10 minutes, integer | "Travel time must be a minimum of 10 minutes." |
| **Schedule** | Add / Edit | Departure Time | Valid 24-hour time string | "Please provide a valid departure time." |
| | | Route Link | Must reference an existing, active Route | "A valid route must be selected." |
| **Trip** | Create | Assignment | Assigned Jeepney must be in `Available` status | "Selected Jeepney is currently unavailable or in transit." |
| | | Schedule | Must not conflict with another trip on the same day | "A trip has already been scheduled for this slot today." |
| **Passenger Stats**| Record | Passenger Count | Must be an integer $\ge 0$ AND $\le$ Jeepney Capacity | "Passenger count cannot exceed Jeepney capacity of [X]." |

---

## 8. Detailed Module Design & UI Blueprints

### 8.1 Dashboard Module

#### Purpose
To provide users with high-fidelity, real-time insights into terminal traffic, occupancy trends, route efficiency, and projected revenues using responsive visual elements and Bento Grid placement.

#### UI Elements & Bento Grid Widgets
1. **Analytical Metric Cards (Row 1):**
   * **Active Trips Indicator:** Live count of trips in `Boarding` or `In Transit`.
   * **Terminal Passenger Count:** Aggregated passengers dispatched today.
   * **Jeepney Availability Ratio:** Progress ring showing (Available Jeepneys / Total Jeepneys).
   * **Today's Projected Revenue:** Currency visualizer displaying computed estimations.
2. **Visual Charts (Row 2 - Bento Layout):**
   * **Passenger Trends (Recharts Line Chart):** Plots passenger counts over selected time increments.
   * **Route Usage Distribution (Recharts Bar Chart):** Compares trips completed per route to identify bottlenecks.
   * **Occupancy Trends (Recharts Area Chart):** Shows average seat fill-rates across departure times to optimize scheduling.
3. **Control Filters:**
   * **Revenue Filter Dropdown:** Toggles charts and metrics between **Today**, **Weekly**, and **Monthly** aggregates.
4. **Recent Activities Feed (Sidebar/Bottom Panel):**
   * A scrolling, read-only feed logging real-time operational state changes (e.g., *"Jeepney [BGA-8821] changed state to In Transit"* or *"Trip [TR-2026-004] marked Completed"*).

---

### 8.2 Jeepney Management Module

#### Purpose
Registers, updates, and monitors physical jeepney assets stationed at the terminal.

#### Schema & Fields
* `jeepneyNumber`: Auto-generated identifier string (e.g., `JP-0042`).
* `plateNumber`: String. Mandatory. Validated against standard plate formats.
* `type`: Enum selection: `Traditional Jeepney` or `E-Jeep`.
* `capacity`: Integer. Passenger capacity of the vehicle.
* `status`: Enum string: `Available` (ready for dispatch), `In Transit` (currently active in a trip), or `Inactive` (disabled for repairs).

#### UI Elements & Interactions
* **Dynamic Grid View:** Glassmorphism card list showing active vehicle specs with stylized status badges.
* **Control Header:** A search bar (by plate number) and a filter dropdown (by status, by vehicle type).
* **Creation Drawer:** Slides out from the right for adding/editing vehicles without leaving the list context.

---

### 8.3 Route Management Module

#### Purpose
Allows operations personnel to map route patterns, estimate runtimes, and establish standard pricing baselines.

#### Scope of Municipalities
* Authorized options list: `Solano`, `Bayombong`, `Bagabag`, `Bambang`, `Aritao`, `Sta. Fe` (all located in Nueva Vizcaya).

#### Schema & Fields
* `origin`: Enum selection of authorized municipalities.
* `destination`: Enum selection. Must not equal origin.
* `estimatedTravelTime`: Integer (minutes). Time required to complete the route.
* `estimatedFare`: Decimal (₱). Default passenger cost for analytics calculation.

#### UI Elements & Interactions
* **Interactive Route Cards:** Displaying routes with map-marker iconography and large-text Fare tags.
* **Search / Filter:** Filter by origin municipality, destination municipality, or sort by lowest/highest fare.

---

### 8.4 Schedule Management Module

#### Purpose
Establish daily recurring departure slots bound to active routes to organize dispatch queues.

#### Schema & Fields
* `routeId`: Unique ObjectID reference of the bound Route.
* `departureTime`: 24h Time string (e.g., `07:30`, `14:45`).
* `expectedArrivalTime`: Calculated or entered 24h time string based on route run-time.
* `status`: Enum selection: `Active` or `Inactive`.

#### UI Elements & Interactions
* **Timeline Timetable Grid:** Grouped by Route. Shows cards representing designated time slots.
* **Slot Toggle:** Quick-switch slide toggle to activate or deactivate scheduling slots.

---

### 8.5 Trip Management Module

#### Purpose
The central execution interface for daily terminal operations. Controls live boarding, dispatching, transit statuses, and cancellations.

#### Schema & Fields
* `tripCode`: Auto-generated dispatch string (e.g., `TR-260701-002`).
* `tripDate`: ISO Date string. Automatically defaults to today's date on creation.
* `jeepneyId`: ObjectID referencing assigned `Available` Jeepney.
* `routeId`: ObjectID referencing Route.
* `scheduleId`: ObjectID referencing specific Schedule slot.
* `passengerCount`: Integer. Logged upon transitioning to Boarding/Completed.
* `status`: Enum string: `Scheduled`, `Boarding`, `In Transit`, `Completed`, `Cancelled`.

#### UI Components & Visual Identifiers
* **Status Badges & Row Colors:**
  * `Scheduled`: Slate Gray badge.
  * `Boarding`: Pulsing Amber / Orange badge.
  * `In Transit`: Vibrant Green badge.
  * `Completed`: Clean Blue badge.
  * `Cancelled`: Muted Red badge.
* **State Control Actions:** Grouped interactive buttons that dynamically render based on current state:
  * If `Scheduled` $\rightarrow$ Show `Start Boarding` button.
  * If `Boarding` $\rightarrow$ Show `Passenger Input Form` and `Dispatch Trip` button.
  * If `In Transit` $\rightarrow$ Show `Mark Completed` button.
  * If `Scheduled` or `Boarding` $\rightarrow$ Show `Cancel Trip` button.

---

### 8.6 Passenger Statistics Module

#### Purpose
Calculates, formats, and tracks passenger occupancy ratios and financial estimates.

#### Calculated Fields & Metrics
* **Occupancy Rate (%) Formula:**
  $$\text{Occupancy Rate} = \left( \frac{\text{Trip Passenger Count}}{\text{Assigned Jeepney Capacity}} \right) \times 100$$
  *Renders as a dynamic meter bar (Green if $\ge 80\%$, Yellow if $50\% \text{ to } 79\%$, Red if $< 50\%$).*
* **Estimated Revenue Formula:**
  $$\text{Estimated Revenue} = \text{Passenger Count} \times \text{Route Estimated Fare}$$
  *Renders as a formatted peso string (e.g., `₱1,250.00`).*

---

### 8.7 Reports Module

#### Purpose
Aggregates daily and weekly operations data for local printouts or administrative reviews.

#### Document Definitions
1. **Daily Trip Report:** Summarizes all completed dispatches, total passengers, and total computed revenues for the calendar date.
2. **Passenger Summary Report:** Identifies passenger load distribution across different routes and times.
3. **Route Summary Report:** Ranks routes by total trips and occupancy efficiency.
4. **Jeepney Activity Report:** Audits specific vehicle utilization statistics to check active vs. inactive ratios.

#### Export and Formatting Features
* **Interactive Data Grid:** Sorted by trip date.
* **Export Actions:** Download compiled operational tabular formats as clean PDFs or print-ready layouts.

---

### 8.8 Synchronization Module

#### Purpose
Ensures data generated locally at terminal stations is successfully and securely synchronized with central servers.

#### Schema & Synchronization Payload
* `syncId`: Auto-generated reference string (e.g., `SYNC-04829`).
* `lastSync`: Timestamp of last successful upload.
* `recordsTransmitted`: Count of transaction items successfully pushed.
* `syncStatus`: Enum string represented by high-contrast badges:
  * `Success`: Solid Green badge.
  * `Failed`: Bordered Red badge.
  * `Pending`: Yellow blinking status.

#### Resilience Handlers
* **Manual Retry Trigger:** An orange button enabling manual payload push if an initial scheduled connection fails.
* **Log Console:** A micro-terminal component showing chronological request-response statuses (e.g., `[2026-07-01 22:30] Sync initiated... Connection Success... 42 records processed.`).

---

### 8.9 Admin Dashboard Module

#### Purpose
Provides administrators with global oversight of all operations and administrative system configurations.

#### Grid Controls & Visualizers
* **Operational Parameter Toggles:** Define centralized fares and municipality lists.
* **Personnel Status Table:** Add, edit, activate, or deactivate dispatcher accounts with single-click actions.
* **Central System Status:** High-contrast connectivity monitors checking if the synchronization API endpoints are active.
* **Audit Trail Feed:** Security logging of actions (e.g., *"Admin password reset for user: dispatcher_maria"*).

---

### 8.10 Transportation Personnel Dashboard Module

#### Purpose
An operational command center optimized for dispatchers managing live queues and vehicle turnarounds.

#### Key Focus Widgets
* **Live Jeepney Terminal Queue:** Lists active `Available` jeepneys currently parked and waiting for trip assignment.
* **Today's Operational Metrics Panel:** Displaying trips completed today, cancelled counters, peak times, and real-time passenger loads.
* **Rapid Dispatch Action Button:** A hero action button triggering the Trip Creation wizard directly from the dashboard view.

---

## 9. Visual Theme and Layout Specs

* **Theme Type:** Unified Dark Theme
* **Canvas Background:** Deep Charcoal / Midnight Gray (`#0F172A`)
* **Card Material:** Semitransparent Glassmorphism (`rgba(30, 41, 59, 0.7)` with thin `#334155` border and subtle backdrop blur)
* **Primary Accent:** Neon Orange (`#F97316`)
* **Typography Pairing:**
  * **Headers & Displays:** `Space Grotesk` (for a modern, technical, crisp aesthetic)
  * **Interfaces & Body:** `Inter` (high-readability sans-serif)
  * **Metrics & Status:** `JetBrains Mono` (for clear data alignments and values)
