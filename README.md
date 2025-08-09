# Welcome to SchedView — CPU Scheduling Visualizer


![React](https://img.shields.io/badge/React-18.3.1-61dafb?style=for-the-badge&logo=react)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css)

https://cpu-scheduling-visualizer-psi.vercel.app/
**SchedView-CPU-Scheduling-Visualizer** is a web application that helps you understand CPU scheduling algorithms through interactive visualizations.  
You can explore multiple scheduling algorithms, see how processes are executed in **real-time** with a histogram or Gantt chart, and view calculated performance metrics.

## The scheduling algorithms currently available are:

- **First Come First Serve (FCFS)**
- **Shortest Job First (SJF)**
- **Shortest Remaining Time First (SRTF)**
- **Round Robin**
- **Priority Scheduling**
- **Preemptive Priority Scheduling**

## Features

- Animated histogram and Gantt chart views  
- Interactive process management (add, edit, delete)  
- Automatic performance metrics: Average Waiting Time, Turnaround Time, Response Time  
- Cyberpunk-themed UI with responsive design  
- Keyboard shortcuts for quick control  

## Running locally

To run the project locally, install Node.js, clone the repository, install dependencies, and start the development server.

```console
git clone https://github.com/Anshuman117/SchedView-CPU-Scheduling-Visualizer
cd SchedView-CPU-Scheduling-Visualizer
npm install
npm run dev
