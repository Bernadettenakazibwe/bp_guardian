# BP Guardian

## Table of Contents

1. [Introduction](#introduction)
2. [Motivation](#motivation)
3. [Problem Exploration and User Needs](#problem-exploration-and-user-needs)
4. [System Design and Architecture](#system-design-and-architecture)
   - [Addressing the Need for Offline Access and Reliability](#addressing-the-need-for-offline-access-and-reliability)
   - [Supporting Consistent Data Logging and Preventing Data Loss](#supporting-consistent-data-logging-and-preventing-data-loss)
   - [Improving Understanding Through Clear Feedback and Visualization](#improving-understanding-through-clear-feedback-and-visualization)
   - [Integrating Mood Tracking](#integrating-mood-tracking)
   - [Ensuring Simplicity, Motivation, and Long-Term Engagement](#ensuring-simplicity-motivation-and-long-term-engagement)
5. [Frontend and Backend Interaction](#frontend–and-backend-interaction)
   - [Request Flow Between Frontend and Backend](#request-flow-between-frontend-and-backend)
   - [Backend Responsibilities and Key Files](#backend-responsibilities-and-key-files)
   - [Frontend Responsibilities and Key Files](#frontend-responsibilities-and-key-files)
   - [Offline Support and Synchronization Files](#offline-support-and-synchronization-files)
6. [System Evaluation: What Is Working Well](#system-evaluation-what-is-working-well)
7. [System Limitations](#system-limitations)
8. [How to Access and Run the Project](#how-to-access-and-run-the-project)
   - [Option 1: Running the Project Using GitHub Codespaces](#option-1-running-the-project-using-github-codespaces)
   - [Option 2: Running the Project Locally](#option-2-running-the-project-locally)
   - [Verifying That the App Is Running Correctly](#verifying-that-the-app-is-running-correctly)
   - [Common Issues and Fixes](#common-issues-and-fixes)




## Introduction 

Hypertension (high blood pressure) is one of the most significant and rapidly growing public health challenges in Uganda. Epidemiological research has shown that more than one in four adults in certain regions of the country experience high blood pressure, with an age-standardized prevalence of approximately 27.2% among adults aged 15 years and above (Musinguzi & Nuwaha, 2013). Despite this high prevalence, the proportion of individuals who are aware that they have hypertension remains alarmingly low. In the same community-based survey, only 28.2% of those with hypertension were aware of their condition, and a mere 9.4% had their blood pressure under control (Musinguzi & Nuwaha, 2013). These findings point to an urgent need for continuous monitoring, improved awareness, and better self-management strategies for hypertension, especially given its role as a major risk factor for cardiovascular diseases.

Low awareness and poor control of hypertension are not unique to localized studies but reflect broader patterns seen across sub-Saharan Africa, where undiagnosed and untreated high blood pressure contributes substantially to morbidity and mortality (Uganda Public Health Fellowship Program, 2023). The silent nature of hypertension like often lacking clear symptoms, means many people do not measure their blood pressure until serious complications arise, such as stroke or heart attack. This situation is compounded by limited health infrastructure, long distances to clinics, transport costs, and a lack of accessible self-monitoring tools for rural and low-resource communities.

BP Guardian is developed to directly address these gaps by providing an offline-capable health monitoring application that allows users to consistently record, visualize, and understand their blood pressure trends over time. The application is intentionally designed to function where internet access is intermittent or unavailable, making it particularly suited for rural Ugandan contexts and similar settings across sub-Saharan Africa.

## Motivation

The motivation behind BP Guardian arises from the intersection of three critical challenges: the high burden of hypertension in Uganda, limited access to continuous healthcare services, and unreliable internet connectivity in many communities. While hypertension is a manageable condition, effective control depends heavily on regular blood pressure monitoring, consistent medication adherence, and an understanding of how daily habits and emotional well-being influence cardiovascular health. Unfortunately, for many Ugandans, these conditions are difficult to meet in practice.

In rural and peri-urban areas, access to healthcare facilities is often constrained by distance, transport costs, and long waiting times. As a result, individuals tend to measure their blood pressure only during clinic visits, which may occur weeks or months apart. Studies show that home blood pressure monitoring significantly improves hypertension awareness and control by enabling early detection of abnormal trends and supporting timely clinical intervention (Omboni & Gazzola, 2018). However, most existing digital health tools assume constant internet access, making them unsuitable for low-connectivity environments.

This gap was repeatedly highlighted during informal interviews with hypertensive patients. For example, Mrs. Olivia Kitaka from Jinja District explained that she does not track her blood pressure consistently because she has “no place to write the numbers” and does not understand what the readings mean. She also noted that clinic visits are infrequent due to distance and transport costs. Similarly, Miss Kikomeko from Wakiso District shared that she only checks her blood pressure when she feels unwell and relies entirely on nearby clinics for both measurement and interpretation. Her village has poor internet coverage, making mobile health applications that require continuous connectivity impractical.

Healthcare professionals echoed these concerns. A general practitioner in Lira District, Dr. Michelle Okello, emphasized that many patients arrive at clinics without reliable blood pressure records, making it difficult to assess trends or adjust treatment plans. According to her, a simple, offline-capable tool that supports consistent tracking and trend visualization could substantially improve follow-up care and long-term disease management.

BP Guardian was therefore motivated by the need for a simple, offline-first, patient-centered solution that empowers users to take ownership of their health data. By allowing blood pressure and mood logging without requiring internet access, and by translating raw numbers into understandable trends and recommendations, the application aims to bridge the gap between clinical care and everyday self-management. This approach aligns with evidence that digital self-monitoring tools, when designed for accessibility and contextual constraints, can improve adherence, awareness, and health outcomes in low-resource settings (World Health Organization, 2022).

## Problem Exploration and User Needs:

To design an effective hypertension self-management tool, it was essential to understand the daily challenges faced by individuals living with high blood pressure, particularly in low-resource and low-connectivity settings. The problem is not only medical but also behavioral, educational, and infrastructural. Through contextual research, informal interviews, and review of related literature, several recurring issues emerged that directly informed the design of BP Guardian.

One major challenge is inconsistent blood pressure tracking. Many individuals do not record their readings regularly, either because they lack a physical logbook, forget to write down measurements, or rely entirely on clinic visits for documentation. This results in fragmented or missing data, making it difficult for both patients and healthcare providers to assess long-term trends. Research shows that inconsistent monitoring significantly reduces the effectiveness of hypertension management and delays timely medical intervention (Muntner et al., 2019).

Another key issue is limited understanding of blood pressure values. Patients often receive numerical readings such as “140 over 90” without clear explanations of what these numbers mean or whether they indicate a healthy or dangerous condition. Without contextual interpretation, users are unable to make informed decisions or recognize warning signs. Studies indicate that health literacy plays a critical role in blood pressure control, with lower literacy levels associated with poorer outcomes (Magnani et al., 2018).

Poor internet connectivity further compounds these challenges. Many rural and peri-urban areas in Uganda experience intermittent or unavailable internet access. Applications that depend on constant connectivity fail to function reliably in such environments, discouraging long-term use. This technological barrier excludes a significant portion of the population from benefiting from digital health innovations, despite evidence that mobile health tools can improve self-care when appropriately adapted to local conditions (WHO, 2022).

Additionally, emotional and psychological factors such as stress, anxiety, and mood fluctuations are often overlooked in hypertension management. Emerging evidence shows a strong relationship between psychological stress and elevated blood pressure, yet most self-monitoring tools do not incorporate mood tracking or stress-related insights (Rozanski et al., 2019). This disconnect limits users’ ability to understand how their emotional state influences their physical health.

From these observations, several user needs were identified and directly translated into system requirements:

Users need a simple and reliable way to log blood pressure readings without relying on paper records or continuous internet access. They also need clear, understandable feedback that explains whether their readings are normal, elevated, or dangerous. The system must support offline-first functionality, ensuring that users can continue logging and viewing data even in the absence of network connectivity. Furthermore, users benefit from trend visualization, rather than isolated readings, to help them understand how their blood pressure changes over time.

Motivational elements, such as reminders, progress indicators, and achievement badges, were also identified as important for encouraging sustained engagement. Finally, users expressed the need for actionable recommendations, presented in simple language, that guide lifestyle decisions and signal when professional medical attention may be necessary.


## System Design and Architecture

The design of BP Guardian follows a user-centered, offline-first architecture, ensuring that the system directly addresses the practical challenges identified during problem exploration. Each architectural decision was guided by the goal of making hypertension self-management accessible, understandable, and reliable in low-connectivity environments. The system is implemented as a Progressive Web Application (PWA) with a client–server architecture, combining a lightweight Flask backend with a modular JavaScript frontend.

At a high level, the system is divided into three tightly integrated layers: the frontend (browser-based client), the offline support layer, and the backend API and data layer. This separation of concerns improves maintainability, scalability, and clarity, while also ensuring that user needs are met even when parts of the system (such as network connectivity) are unavailable.

### Addressing the Need for Offline Access and Reliability

One of the most critical user needs identified was the ability to use the application without continuous internet access. To fulfill this requirement, BP Guardian adopts an offline-first strategy using a Service Worker and browser-based storage mechanisms. The Service Worker intercepts network requests and caches essential assets such as HTML pages, JavaScript files, stylesheets, and images. This allows the application interface to load reliably even when the user is offline or experiencing poor connectivity.

In addition, dynamic health data such as dashboard statistics, recent blood pressure readings, and mood logs are cached locally after successful online requests. When the application detects that the user is offline, it retrieves this cached data instead of attempting to contact the server. This design ensures that users can still view their health information and insights, fulfilling the need for continuous access to personal health data regardless of network conditions.

### Supporting Consistent Data Logging and Preventing Data Loss

Users expressed difficulty in consistently recording blood pressure and mood data, particularly when offline. BP Guardian addresses this through a local request queue mechanism implemented in the frontend. When a user submits a new blood pressure or mood entry while offline, the request is not discarded. Instead, it is stored locally in the browser with metadata such as timestamps and request type.

This queued data is automatically synchronized with the backend when connectivity is restored. The system listens for the browser’s online event and replays queued requests in a controlled and reliable manner. This approach ensures data integrity and prevents loss of critical health information, directly addressing users’ concerns about forgotten or missing records.

### Improving Understanding Through Clear Feedback and Visualization

Another major user need was better understanding of what blood pressure readings mean. To meet this requirement, BP Guardian includes a rules-based analytics layer on the backend that classifies readings into clinically recognized categories such as normal, elevated, stage 1 hypertension, and stage 2 hypertension. These classifications are derived from established medical guidelines and translated into clear, user-friendly feedback.

On the frontend, the dashboard presents this information using visual summaries and trend charts rather than raw numbers alone. Line charts display changes in systolic and diastolic pressure over time, while summary cards highlight averages, minimums, maximums, and trends. By presenting information visually, the system helps users identify patterns and recognize potential risks, fulfilling the need for easy interpretation and self-awareness.

### Integrating Mood Tracking

Research and user feedback highlighted the influence of stress and mood on blood pressure, yet most tracking tools ignore this relationship. BP Guardian intentionally integrates mood logging as a core system feature. Mood data is collected alongside blood pressure readings and analyzed in relation to BP trends.

The architecture supports this integration by treating mood logs as first-class data entities within both the frontend and backend. Correlation analysis is performed on the backend and visualized on the frontend using combined charts. This design fulfills the user need for holistic health insight, helping users understand how emotional well-being affects their physical condition.

### Ensuring Simplicity, Motivation, and Long-Term Engagement

To encourage sustained use, the system incorporates gamification elements such as achievement badges and progress indicators. These features are implemented through a dedicated backend badge engine that evaluates user activity and awards achievements automatically. From a design perspective, this reduces cognitive effort for users while providing positive reinforcement for healthy behaviors.

The frontend architecture supports this by dynamically updating badge status and notifying users when achievements are unlocked. This directly addresses user needs related to motivation, habit formation, and long-term engagement, which are essential for managing chronic conditions like hypertension.

## Frontend and Backend Interaction

BP Guardian follows a client–server interaction model where the frontend is responsible for user interaction, offline handling, and visualization, while the backend manages data persistence, business logic, and health analysis. Communication between the two layers occurs through RESTful API endpoints using standard HTTP methods.

When a user interacts with the application such as logging a blood pressure reading, recording mood, or viewing the dashboard, the frontend sends a request to the backend using the Fetch API. Each request includes the authenticated user’s ID in the request headers, allowing the backend to correctly associate data with the logged-in user. The backend processes the request, performs validation and analysis, stores or retrieves data from the database, and returns a JSON response to the frontend.

A key design principle of BP Guardian is that the frontend does not assume constant backend availability. Instead, it acts as a smart client that adapts its behavior depending on network availability. When the backend is reachable, the system operates in real time. When the backend is unreachable, the frontend switches to offline mode, relying on cached data and queued requests. This interaction model ensures reliability and continuity of use in low-connectivity environments.

### Request Flow Between Frontend and Backend

In normal online operation, the interaction follows a straightforward request–response cycle. The frontend captures user input, sends it to the backend API, and updates the user interface based on the response.

#### For example, when a user submits a blood pressure reading:

   1. The frontend collects the systolic and diastolic values from the form.

   2. The api.js module sends a POST request to the /api/bp endpoint.

   3. The backend validates the data and stores it in the database.

   4. The backend evaluates health rules and badge eligibility.

   5. A response is returned containing confirmation, updated stats, and any earned badges.

   6. The frontend updates the dashboard and displays feedback to the user.

In offline scenarios, this flow is modified. Instead of failing, the frontend stores the request locally and prevents communication with the backend until connectivity is restored. Once the browser detects that the application is online again, the queued requests are automatically synchronized.

### Backend Responsibilities and Key Files

The backend is implemented using Flask, a lightweight Python web framework. Its primary role is to manage persistent data, enforce business rules, and generate health insights.

run.py

This is the main entry point of the application. It initializes the Flask app and starts the development server. When executed, it loads configuration settings, sets up the database connection, and exposes the API endpoints.

backend/init.py

This file contains the Flask application factory. It initializes extensions such as SQLAlchemy and registers routes. This modular approach allows the backend to be scalable and easy to maintain.

backend/models.py

This file defines the database schema using SQLAlchemy models. It includes models for users, blood pressure readings, mood logs, badges, and user-badge relationships. These models represent the persistent state of the application and ensure data integrity.

backend/routes/api.py

This is the core API layer. It defines all REST endpoints used by the frontend, including authentication, blood pressure logging, mood logging, dashboard analytics, badge retrieval, and recommendations. Each endpoint processes incoming requests, interacts with the database, and returns structured JSON responses.

backend/services/rules_engine.py

This file contains the logic for analyzing blood pressure trends and generating health recommendations. It interprets raw BP readings using clinical thresholds and determines risk levels and trends. This separation ensures that medical logic is centralized and reusable.

backend/services/badges.py

This module implements the gamification system. It evaluates user activity against predefined criteria and awards badges when conditions are met. This logic runs automatically whenever new health data is recorded.

### Frontend Responsibilities and Key Files

The frontend is built using HTML, CSS, and modular JavaScript. It is responsible for user interaction, visualization, offline handling, and communication with the backend.

templates/base.html

This is the foundational HTML template for all pages. It defines the layout, navigation bar, and shared UI elements. All other pages extend this template, ensuring consistent structure and styling across the application.

static/js/auth.js

This file manages user authentication on the client side. It handles login and registration requests, stores user credentials in localStorage, and redirects users appropriately. It also ensures protected pages are not accessible without authentication.

static/js/api.js

This is the central communication hub between frontend and backend. All API requests pass through this file. It automatically attaches authentication headers, handles errors, caches GET responses, and delegates offline handling when network failures occur.

static/js/dashboard.js

This module controls the dashboard page. It fetches blood pressure and mood data, computes summary statistics, and renders charts using Chart.js. It updates dynamically based on user-selected time ranges and available data.

static/js/log.js

This file manages the data entry process for blood pressure and mood logs. It validates input, sends data to the backend via the API layer, and provides immediate user feedback. When offline, it confirms that data has been saved locally.

static/js/insights.js

This module provides deeper analysis and educational feedback. It retrieves correlation data and presents it using combined visualizations and explanatory text, helping users understand long-term patterns.

static/js/badges.js

This file handles badge display and achievement notifications. It fetches badge data from the backend and updates the UI to reflect earned and locked achievements.

### Offline Support and Synchronization Files

Offline capability is implemented entirely on the frontend but closely coordinated with backend behavior.

static/js/offline-storage.js

This file manages localStorage for offline use. It maintains two key structures: a cache for API responses and a queue for pending write requests. This ensures data availability and reliability during offline usage.

static/js/offline-status.js

This module tracks connectivity state and displays visual indicators when the application is offline. It also shows how many requests are pending synchronization, keeping users informed and reassured.

static/js/sync.js

This file handles automatic synchronization. It listens for the browser’s online event and sends queued requests to the backend one by one. Successful requests are removed from the queue, while failed ones are retained for later retries.

static/sw.js

The Service Worker operates independently of the main application logic. It caches static assets and HTML pages and intercepts network requests. By serving cached resources when offline, it ensures that the application remains usable even without internet access.

## System Evaluation: What Is Working Well

The BP Guardian system successfully meets its core design goals, particularly its ability to function in environments with unreliable or limited internet connectivity. Both the frontend and backend components work together to provide a stable, user-friendly, and resilient health tracking experience.

One of the strongest aspects of the system is the offline-first functionality. Users are able to open the application, navigate between pages, view previously loaded data, and continue logging blood pressure and mood information even when the internet is unavailable. This directly addresses the real-world context in Uganda, where network access can be instable or expensive. The use of a service worker to cache pages and static assets ensures that the application loads quickly and reliably after the first visit.

The data logging mechanism works reliably in both online and offline modes. When users are offline, blood pressure and mood entries are stored locally without data loss. Once connectivity is restored, the system automatically synchronizes all queued data with the backend. This synchronization process is transparent to the user and provides clear feedback through notifications, which increases user trust in the system.

The dashboard and insights features are also functioning effectively. Users can view meaningful statistics such as average blood pressure, minimum and maximum values, trends over time, and mood correlations. These features help users move beyond raw numbers and gain a clearer understanding of their health patterns. The visual presentation using charts improves comprehension, especially for users with limited medical knowledge.

Another key strength is the rule-based recommendation engine. By translating blood pressure readings into clear categories such as “Normal,” “Elevated,” or “High Risk,” the system provides understandable guidance rather than overwhelming users with clinical data. This aligns well with the needs identified during problem exploration, where users expressed difficulty interpreting BP values.

The badge and gamification system also functions as intended. Users receive immediate feedback and rewards for consistent logging, which encourages long-term engagement. This feature supports behavior change by making health tracking more motivating and less intimidating.

## Demo Video

To view the demo of the BP Guardian application, watch the video below:

<video width="600" controls>
  <source src="videos\VID_20260121_182145.mp4" type="video/mp4">
  
</video>

## System Limitations

One major limitation is the dependency on browser storage for offline data. Offline data is stored in the browser’s localStorage, which is not encrypted and has size limitations. If a user clears their browser data, all offline entries that have not yet been synchronized will be lost. This poses a risk for users who rely heavily on offline functionality over long periods.

Another limitation is the lack of full offline authentication. While logged-in users can continue using the application offline, new users cannot register and logged-out users cannot log in without an internet connection. This is because authentication requires backend validation. As a result, first-time users in completely offline environments are unable to access the system.

The offline experience is also limited to previously visited pages. If a user attempts to access a page that has not yet been cached by the service worker while offline, the page will not load. This behavior is expected in PWA-based systems but may confuse users who are unfamiliar with offline web applications.

From a technical perspective, the current authentication approach is simplified and uses a user ID stored in localStorage rather than secure token-based authentication such as JWT. 

The medical decision logic is rule-based rather than predictive. The recommendation system relies on predefined thresholds and trends rather than machine learning models. While this ensures transparency and safety, it limits the system’s ability to provide personalized or adaptive insights based on long-term user behavior.

Browser Compatibility is also a noticed challenge. Offline features work more reliably on Microsoft Edge as we tested it with both Microsoft Edge and Google Chrome.
Some inconsistencies were observed on Google Chrome, e.g. you can not change between pages. You can view the page you viewed last before going offline. Eg, if you were on the log page, you can enter the data, and it is saved, but you can not navigate to see the dashboard gain until when you are back online.

Service Worker behavior differs slightly between browsers.

<video width="600" controls>
  <source src="videos\VID_20260121_185752.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## How to Access and Run the Project

BP Guardian can be run in two main ways:

   1. Using GitHub Codespaces (recommended for quick setup and evaluation)

   2. Running locally on your computer


### Option 1: Running the Project Using GitHub Codespaces

### Requirements

1. A GitHub account

2. Internet connection

3. Modern web browser (Microsoft Edge recommended)

### Step-by-Step Instructions

1. Open the GitHub Repository

Navigate to the BP Guardian repository on GitHub:

```bash
https://github.com/Bernadettenakazibwe/bp_guardian
```

2. Create a Codespace

3. Click the green Code button

4. Select the Codespaces tab

5. Click Create codespace on main/master

      Wait for the environment to load (this may take 1–3 minutes)

6. Install Project Dependencies

Once the Codespace opens, a terminal will appear at the bottom.

Run the following command:

```bash
pip install -r requirements.txt
```

7. Start the Application

```bash
python run.py
```

8. Open the Application in the Browser

GitHub Codespaces will automatically detect that the app is running on port 5000

A popup will appear saying:

“Your application running on port 5000 is available”

Click  Open in Browser

The app will open at a URL similar to:
```bash
https://<codespace-id>-5000.app.github.dev
```

9. Testing Offline Mode in Codespaces

Because Codespaces runs in the cloud, you must simulate offline mode using browser tools:

a. Open Developer Tools (F12)

b. Go to the Network tab

c. Set Throttling → Offline

d. Refresh the page

e. Try logging a BP or mood entry

5. Turn network back to No throttling to observe auto-sync

### Why Codespaces Is Useful

   1. No local installation required

   2. Works on any device

   3. Easy to share a running version of the app

   5. Same behavior as local setup

### Option 2: Running the Project Locally

### Requirements

1. Python 3.8 or higher

2. Git

3. pip (Python package manager)

4. Modern web browser (Microsoft Edge recommended)

### Step-by-Step Instructions

1. Clone the Repository
```bash
git clone https://github.com/Bernadettenakazibwe/bp_guardian.git

cd bp_guardian
```

2. Create a Virtual Environment

```bash
python -m venv venv
```

3. Activate the Virtual Environment

```bash
Windows

venv\Scripts\activate
```

```bash
macOS / Linux

source venv/bin/activate

```

4. Install Dependencies

```bash
pip install -r requirements.txt
```

5. Run the Flask Application

```bash
python run.py
```

6. Access the Application

Open a browser and go to:

http://127.0.0.1:5000

#### Database Initialization

   The SQLite database (bp_guardian.db) is automatically created on first run

   It is stored in the instance/ directory

   No manual database setup is required

### Verifying That the App Is Running Correctly

##### After launching the app:

1. You should see the login/register page

2. You can create a new account

3. After login, you can:

   Log blood pressure

   Log mood

4. View dashboard and insights

5. Earn badges

6. Test offline behavior

#### Common Issues and Fixes

1. Port 5000 Not Opening

   Ensure python run.py is running

2. Check terminal output for errors

   In Codespaces, confirm the port is forwarded

3. Service Worker Not Working

   Refresh the page after first load

   Check DevTools → Application → Service Workers

   Clear browser cache and reload

4. Offline Mode Not Triggering

   Use DevTools → Network → Offline

   Do not rely on unplugging internet alone (especially in Codespaces)



## References:

Guidelines for hypertension. (n.d.). https://www.who.int/teams/noncommunicable-diseases/guidelines-for-hypertension 

Magnani, J. W., Mujahid, M. S., Aronow, H. D., Cené, C. W., Dickson, V. V., Havranek, E., Morgenstern, L. B., Paasche-Orlow, M. K., Pollak, A., & Willey, J. Z. (2018). Health Literacy and Cardiovascular Disease: Fundamental relevance to primary and secondary prevention: A scientific statement from the American Heart Association. Circulation, 138(2), e48–e74. https://doi.org/10.1161/cir.0000000000000579 

Muntner, P., Shimbo, D., Carey, R. M., Charleston, J. B., Gaillard, T., Misra, S., Myers, M. G., Ogedegbe, G., Schwartz, J. E., Townsend, R. R., Urbina, E. M., Viera, A. J., White, W. B., & Wright, J. T. (2019). Measurement of Blood Pressure in Humans: A Scientific Statement From the American Heart Association. Hypertension, 73(5), e35–e66. https://doi.org/10.1161/hyp.0000000000000087 

Musinguzi, G., & Nuwaha, F. (2013). Prevalence, awareness and control of hypertension in Uganda. PLoS ONE, 8(4), e62236. https://doi.org/10.1371/journal.pone.0062236 

Omboni, S. (2022). Telemedicine for hypertension management: where we stand, where we are headed. Connected Health, 1(2), 85–97. https://doi.org/10.20517/ch.2022.09 

Rozanski, A., Blumenthal, J. A., & Kaplan, J. (1999). Impact of psychological factors on the pathogenesis of cardiovascular disease and implications for therapy. Circulation, 99(16), 2192–2217. https://doi.org/10.1161/01.cir.99.16.2192 

UNIPH. (2025, May 11). Thomas Kiggundu - UNIPH. UNIPH - Uganda National Institute of Public Health. https://uniph.go.ug/uganda-public-health-fellowship-program/advanced-fetp/fe-fellows/fe-cohort-2022/thomas-kiggundu/ 

World Health Organization. (2019). WHO guideline recommendations on digital interventions for health system strengthening. https://iris.who.int/bitstream/handle/10665/311977/WHO-RHR-19.8-eng.pdf?ua=1


