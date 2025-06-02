# Gaza Genocide Casualties Memorial Stream


This project is a web application designed to serve as a live, scrolling memorial for the confirmed casualties in Gaza since October 7th, 2023. It aims to present this sensitive data in a respectful and informative way, with a focus on the human cost of the genocide. This application can also serve as a powerful visual tool for events, vigils, educational settings, or public displays to help convey the scale of loss.
**[https://mattsdevstuff.github.io/Gaza-Casualty-Names/]**

## Features

* **Live Data Stream:** Displays names, ages, gender, and date of birth (where available) of victims, fetched in real-time.
* **Continuous Scrolling Memorial:** Names appear and scroll upwards, creating a continuous stream.
* **Dynamic Data Fetching:** Efficiently loads data in batches as needed, determining the total number of available data pages.
* **Speed Control:** Users can press and hold the **Space Bar** to temporarily increase the speed of the name display and scrolling.
* **Immersive Parallax Background:** Features a multi-layered, subtly animated parallax background of Gaza-inspired art to create a somber and reflective atmosphere.
* **Embeddable Widget:** Provides a simple HTML/JS snippet to allow others to embed a lite version of the memorial stream on their own websites.
* **Download for Offline Use:** Users can download the entire application as a single HTML file to view the memorial offline (data will be as of the last online fetch).
* **Responsive Design:** Adapts to different screen sizes for accessibility on desktop and mobile devices.
* **Clear Data Attribution:** Clearly sources data from the "Killed in Gaza API" by Tech For Palestine.
* **Loading State & User Feedback:** Provides loading indicators and messages for data fetching and user actions.

## How It Works

The application is built with HTML, Tailwind CSS for styling, and vanilla JavaScript for its core logic.

1.  **Data Fetching:**
    * On load, the application first determines the total number of pages available from the Tech For Palestine API (`/api/v2/killed-in-gaza/page-X.json`).
    * It then fetches an initial batch of data (multiple pages) from the highest page numbers downwards.
    * Victim data from these pages is collected and shuffled to ensure a randomized order of appearance.
    * As the displayed names near the end of the current local data buffer, the application proactively fetches the next batch of pages in the background.
2.  **Display Mechanism:**
    * Victims' names and available details are added to the top of a list, which is then animated to scroll upwards.
    * The `requestAnimationFrame` API is used for smooth scrolling.
    * Items that scroll off the top of the viewable area are removed from the DOM to maintain performance.
3.  **Timestamp:**
    * The application also fetches and displays the "last updated" timestamp from the API's summary endpoint (`/api/v3/summary.json`).
4.  **Embeddable Widget:**
    * The embed code generates a self-contained `<div>` and `<script>` that replicates a simplified version of the memorial. It fetches its own data and has a fixed size.
5.  **Offline Download:**
    * The "Download for Offline Use" feature packages the current page's full HTML (including all CSS and JavaScript) into a single `.html` file. This file can then be opened in a browser without an internet connection. The data displayed will be from the last time the app was able to successfully fetch it while online.

## Data Source

All casualty data is sourced from the **Tech For Palestine - Killed in Gaza API**.
* **API Documentation:** [https://data.techforpalestine.org/docs/killed-in-gaza/](https://data.techforpalestine.org/docs/killed-in-gaza/)
* **Summary Endpoint (for last update timestamp):** `https://data.techforpalestine.org/api/v3/summary.json`
* **Paginated Data Endpoint:** `https://data.techforpalestine.org/api/v2/killed-in-gaza/page-X.json`

Please refer to their documentation for more information on data collection methodologies and terms of use.

## Using the Application

1.  Open the `index.html` file (or the deployed live link) in a web browser.
2.  The application will start loading data. A loading indicator will be shown.
3.  Once loaded, names will begin to appear and scroll.
4.  **Press and hold the Space Bar** to speed up the stream. Release to return to normal speed.
5.  Click the **Embed Widget** button (code icon) to get an HTML snippet to embed the memorial on another website.
6.  Click the **Download for Offline Use** button (download icon) to save an HTML file for offline viewing.

## Technologies Used

* **HTML5**
* **Tailwind CSS:** For utility-first styling.
* **Vanilla JavaScript (ES6+):** For all application logic, data fetching, and DOM manipulation.
* **SVG:** For the parallax background layers.

## Setup for Local Development

1.  Clone the repository:
    ```bash
    git clone [your-repository-url]
    ```
2.  Navigate to the project directory:
    ```bash
    cd [project-directory-name]
    ```
3.  Open `index.html` in your web browser.

No build process or complex dependencies are required for the main application.

## Contributing

Contributions are welcome, especially those that enhance the respectful presentation of this data or improve accessibility. Please feel free to fork the repository, make your changes, and submit a pull request.

When contributing, please ensure:
* Changes are tested.
* Code is well-commented, especially for complex logic.
* The primary goal of respectful memorialization is maintained.

---

We hope this project serves as a solemn reminder and a tool for awareness.
