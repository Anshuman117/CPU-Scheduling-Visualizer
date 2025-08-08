import React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { 
  Button, 
  Input, 
  Label, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge,
  Separator,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "./components/ui"
import { Play, Pause, RotateCcw, Plus, Trash2, Cpu, Clock, Zap, BarChart3, Terminal, Activity, Settings, Eye, EyeOff, Shuffle, Github, ExternalLink, Heart } from 'lucide-react'

const ALGORITHM_OPTIONS = [
  { value: "fcfs", label: "FCFS", fullName: "First Come First Serve" },
  { value: "sjf", label: "SJF", fullName: "Shortest Job First" },
  { value: "sjf-preemptive", label: "SRTF", fullName: "Shortest Remaining Time First" },
  { value: "rr", label: "RR", fullName: "Round Robin" },
  { value: "priority", label: "Priority", fullName: "Priority Scheduling" },
  { value: "priority-preemptive", label: "P-Priority", fullName: "Preemptive Priority" },
]

const ALGORITHM_INFO = {
  fcfs: {
    name: "First Come First Serve",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    description: "Non-preemptive scheduling based on arrival time"
  },
  sjf: {
    name: "Shortest Job First",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    description: "Non-preemptive scheduling based on burst time"
  },
  "sjf-preemptive": {
    name: "Shortest Remaining Time First",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    description: "Preemptive version of SJF"
  },
  rr: {
    name: "Round Robin",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    description: "Preemptive scheduling with fixed time quantum"
  },
  priority: {
    name: "Priority Scheduling",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    description: "Non-preemptive scheduling based on priority"
  },
  "priority-preemptive": {
    name: "Preemptive Priority",
    timeComplexity: "O(n²)",
    spaceComplexity: "O(1)",
    description: "Preemptive scheduling based on priority"
  }
}

const PROCESS_COLORS = [
  "#00ffff", "#ff00ff", "#ffff00", "#00ff00", 
  "#ff6600", "#6600ff", "#ff0066", "#66ff00",
  "#ff3366", "#33ff66", "#3366ff", "#ff6633"
]

export default function CPUSchedulerHacker() {
  const [algorithm, setAlgorithm] = useState("fcfs")
  const [processes, setProcesses] = useState([
    { id: "P1", arrivalTime: 0, burstTime: 5, remainingTime: 5, completionTime: 0, waitingTime: 0, turnaroundTime: 0, responseTime: 0 },
    { id: "P2", arrivalTime: 1, burstTime: 3, remainingTime: 3, completionTime: 0, waitingTime: 0, turnaroundTime: 0, responseTime: 0 },
    { id: "P3", arrivalTime: 2, burstTime: 8, remainingTime: 8, completionTime: 0, waitingTime: 0, turnaroundTime: 0, responseTime: 0 },
  ])
  const [timeQuantum, setTimeQuantum] = useState(2)
  const [histogramBars, setHistogramBars] = useState([])
  const [currentTime, setCurrentTime] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1000)
  const [showGantt, setShowGantt] = useState(false)
  const [currentExecutingProcess, setCurrentExecutingProcess] = useState(null)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)

  const simulationRef = useRef(null)
  const animationRef = useRef(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case ' ':
            e.preventDefault()
            if (isSimulating) {
              togglePause()
            } else {
              startSimulation()
            }
            break
          case 'r':
            e.preventDefault()
            resetSimulation()
            break
          case 'g':
            e.preventDefault()
            generateRandomProcesses()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isSimulating])

  const addProcess = () => {
    const newId = `P${processes.length + 1}`
    setProcesses([...processes, {
      id: newId,
      arrivalTime: 0,
      burstTime: 1,
      remainingTime: 1,
      completionTime: 0,
      waitingTime: 0,
      turnaroundTime: 0,
      responseTime: 0
    }])
  }

  const removeProcess = (id) => {
    if (processes.length > 1) {
      setProcesses(processes.filter(p => p.id !== id))
    }
  }

  const updateProcess = (id, field, value) => {
    setProcesses(processes.map(p => 
      p.id === id 
        ? { ...p, [field]: value, ...(field === 'burstTime' ? { remainingTime: value } : {}) }
        : p
    ))
  }

  const generateRandomProcesses = () => {
    const count = Math.floor(Math.random() * 4) + 3 // 3-6 processes
    const newProcesses = []
    
    for (let i = 0; i < count; i++) {
      const burstTime = Math.floor(Math.random() * 10) + 1
      newProcesses.push({
        id: `P${i + 1}`,
        arrivalTime: Math.floor(Math.random() * 5),
        burstTime,
        priority: Math.floor(Math.random() * 5) + 1,
        remainingTime: burstTime,
        completionTime: 0,
        waitingTime: 0,
        turnaroundTime: 0,
        responseTime: 0
      })
    }
    
    setProcesses(newProcesses)
  }

  const resetSimulation = () => {
    if (simulationRef.current) clearInterval(simulationRef.current)
    if (animationRef.current) clearInterval(animationRef.current)
    
    setHistogramBars([])
    setCurrentTime(0)
    setIsSimulating(false)
    setIsPaused(false)
    setCurrentExecutingProcess(null)
    setProcesses(processes.map(p => ({
      ...p,
      remainingTime: p.burstTime,
      completionTime: 0,
      waitingTime: 0,
      turnaroundTime: 0,
      responseTime: 0,
      startTime: undefined
    })))
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const calculateMetrics = (completedProcesses) => {
    return {
      avgWaitingTime: completedProcesses.reduce((sum, p) => sum + p.waitingTime, 0) / completedProcesses.length,
      avgTurnaroundTime: completedProcesses.reduce((sum, p) => sum + p.turnaroundTime, 0) / completedProcesses.length,
      avgResponseTime: completedProcesses.reduce((sum, p) => sum + p.responseTime, 0) / completedProcesses.length,
    }
  }

  const simulateScheduling = useCallback(() => {
    const processList = processes.map(p => ({ ...p, remainingTime: p.burstTime }))
    const bars = []

    // Algorithm-specific simulation logic
    const simulate = () => {
      switch (algorithm) {
        case "fcfs":
          return simulateFCFS(processList, bars)
        case "sjf":
          return simulateSJF(processList, bars, false)
        case "sjf-preemptive":
          return simulateSJF(processList, bars, true)
        case "rr":
          return simulateRR(processList, bars)
        case "priority":
          return simulatePriority(processList, bars, false)
        case "priority-preemptive":
          return simulatePriority(processList, bars, true)
        default:
          return { bars: [], maxTime: 0, processes: processList }
      }
    }

    return simulate()
  }, [algorithm, processes, timeQuantum])

  const simulateFCFS = (processList, bars) => {
    const sorted = [...processList].sort((a, b) => a.arrivalTime - b.arrivalTime)
    let currentTime = 0

    sorted.forEach((process, index) => {
      if (currentTime < process.arrivalTime) {
        currentTime = process.arrivalTime
      }

      if (process.startTime === undefined) {
        process.startTime = currentTime
        process.responseTime = currentTime - process.arrivalTime
      }

      bars.push({
        processId: process.id,
        startTime: currentTime,
        endTime: currentTime + process.burstTime,
        color: PROCESS_COLORS[index % PROCESS_COLORS.length],
        currentLength: 0,
        targetLength: process.burstTime,
        isActive: false
      })

      currentTime += process.burstTime
      process.completionTime = currentTime
      process.turnaroundTime = process.completionTime - process.arrivalTime
      process.waitingTime = process.turnaroundTime - process.burstTime
    })

    return { bars, maxTime: currentTime, processes: sorted }
  }

  const simulateSJF = (processList, bars, preemptive) => {
    let currentTime = 0
    let completed = 0
    const n = processList.length

    while (completed < n) {
      const available = processList.filter(p => 
        p.arrivalTime <= currentTime && p.remainingTime > 0
      )

      if (available.length === 0) {
        currentTime++
        continue
      }

      const selected = available.reduce((min, p) => 
        p.remainingTime < min.remainingTime ? p : min
      )

      if (selected.startTime === undefined) {
        selected.startTime = currentTime
        selected.responseTime = currentTime - selected.arrivalTime
      }

      const executionTime = preemptive ? 1 : selected.remainingTime
      const processIndex = processes.findIndex(p => p.id === selected.id)

      bars.push({
        processId: selected.id,
        startTime: currentTime,
        endTime: currentTime + executionTime,
        color: PROCESS_COLORS[processIndex % PROCESS_COLORS.length],
        currentLength: 0,
        targetLength: executionTime,
        isActive: false
      })

      selected.remainingTime -= executionTime
      currentTime += executionTime

      if (selected.remainingTime === 0) {
        selected.completionTime = currentTime
        selected.turnaroundTime = selected.completionTime - selected.arrivalTime
        selected.waitingTime = selected.turnaroundTime - selected.burstTime
        completed++
      }
    }

    return { bars, maxTime: currentTime, processes: processList }
  }

  const simulateRR = (processList, bars) => {
    const queue = []
    let currentTime = 0
    let completed = 0

    // Add initial processes
    processList.forEach(p => {
      if (p.arrivalTime <= currentTime) {
        queue.push(p)
      }
    })

    while (completed < processList.length) {
      if (queue.length === 0) {
        currentTime++
        processList.forEach(p => {
          if (p.arrivalTime === currentTime && p.remainingTime > 0) {
            queue.push(p)
          }
        })
        continue
      }

      const current = queue.shift()
      
      if (current.startTime === undefined) {
        current.startTime = currentTime
        current.responseTime = currentTime - current.arrivalTime
      }

      const executionTime = Math.min(timeQuantum, current.remainingTime)
      const processIndex = processes.findIndex(p => p.id === current.id)

      bars.push({
        processId: current.id,
        startTime: currentTime,
        endTime: currentTime + executionTime,
        color: PROCESS_COLORS[processIndex % PROCESS_COLORS.length],
        currentLength: 0,
        targetLength: executionTime,
        isActive: false
      })

      current.remainingTime -= executionTime
      currentTime += executionTime

      // Check for new arrivals
      processList.forEach(p => {
        if (p.arrivalTime > currentTime - executionTime && 
            p.arrivalTime <= currentTime && 
            p.remainingTime > 0 && 
            !queue.includes(p) && 
            p !== current) {
          queue.push(p)
        }
      })

      if (current.remainingTime === 0) {
        current.completionTime = currentTime
        current.turnaroundTime = current.completionTime - current.arrivalTime
        current.waitingTime = current.turnaroundTime - current.burstTime
        completed++
      } else {
        queue.push(current)
      }
    }

    return { bars, maxTime: currentTime, processes: processList }
  }

  const simulatePriority = (processList, bars, preemptive) => {
    let currentTime = 0
    let completed = 0

    while (completed < processList.length) {
      const available = processList.filter(p => 
        p.arrivalTime <= currentTime && p.remainingTime > 0
      )

      if (available.length === 0) {
        currentTime++
        continue
      }

      const selected = available.reduce((highest, p) => 
        (p.priority || 0) > (highest.priority || 0) ? p : highest
      )

      if (selected.startTime === undefined) {
        selected.startTime = currentTime
        selected.responseTime = currentTime - selected.arrivalTime
      }

      const executionTime = preemptive ? 1 : selected.remainingTime
      const processIndex = processes.findIndex(p => p.id === selected.id)

      bars.push({
        processId: selected.id,
        startTime: currentTime,
        endTime: currentTime + executionTime,
        color: PROCESS_COLORS[processIndex % PROCESS_COLORS.length],
        currentLength: 0,
        targetLength: executionTime,
        isActive: false
      })

      selected.remainingTime -= executionTime
      currentTime += executionTime

      if (selected.remainingTime === 0) {
        selected.completionTime = currentTime
        selected.turnaroundTime = selected.completionTime - selected.arrivalTime
        selected.waitingTime = selected.turnaroundTime - selected.burstTime
        completed++
      }
    }

    return { bars, maxTime: currentTime, processes: processList }
  }

  const startSimulation = () => {
    resetSimulation()
    setIsSimulating(true)

    const { bars, maxTime, processes: simulatedProcesses } = simulateScheduling()
    setProcesses(simulatedProcesses)

    let barIndex = 0
    let timeElapsed = 0

    const animate = () => {
      if (barIndex < bars.length && !isPaused) {
        const currentBar = bars[barIndex]
        
        if (timeElapsed === currentBar.startTime) {
          setCurrentExecutingProcess(currentBar.processId)
          setHistogramBars(prev => [...prev, { ...currentBar, isActive: true }])
        }

        if (timeElapsed >= currentBar.startTime && timeElapsed < currentBar.endTime) {
          const progress = (timeElapsed - currentBar.startTime) / currentBar.targetLength
          setHistogramBars(prev => prev.map((bar, idx) => 
            idx === barIndex ? { ...bar, currentLength: progress * bar.targetLength } : bar
          ))
        }

        if (timeElapsed === currentBar.endTime - 1) {
          setHistogramBars(prev => prev.map((bar, idx) => 
            idx === barIndex ? { ...bar, isActive: false, currentLength: bar.targetLength } : bar
          ))
          barIndex++
        }

        setCurrentTime(timeElapsed)
        timeElapsed++

        if (timeElapsed <= maxTime) {
          simulationRef.current = setTimeout(animate, simulationSpeed)
        } else {
          setIsSimulating(false)
          setCurrentExecutingProcess(null)
        }
      } else if (isPaused) {
        simulationRef.current = setTimeout(animate, 100)
      }
    }

    animate()
  }

  const maxTime = Math.max(...histogramBars.map(bar => bar.endTime), 1)
  const metrics = calculateMetrics(processes.filter(p => p.completionTime > 0))

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden">
        {/* Animated Matrix Background */}
        <div className="fixed inset-0 opacity-5">
          <div className="matrix-bg"></div>
        </div>

        {/* Scanlines Effect */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="scanlines"></div>
        </div>

        <div className="relative z-10 h-screen flex">
          {/* Left Panel - Controls */}
          <div className={`transition-all duration-500 ${leftPanelCollapsed ? 'w-12' : 'w-80'} bg-gray-900/90 backdrop-blur-sm border-r border-cyan-500/30`}>
            <div className="p-4 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className={`flex items-center gap-2 ${leftPanelCollapsed ? 'hidden' : ''}`}>
                  <Terminal className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-lg font-bold text-cyan-400">CONTROL_PANEL</h2>
                </div>
                <Button
                  onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                  variant="ghost"
                  size="sm"
                  className="text-cyan-400 hover:bg-cyan-400/10"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>

              {!leftPanelCollapsed && (
                <div className="space-y-6">
                  {/* Algorithm Selection */}
                  <Card className="bg-black/50 border-cyan-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-cyan-400 text-sm flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        ALGORITHM
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Select value={algorithm} onValueChange={setAlgorithm}>
                        <SelectTrigger className="bg-black/70 border-green-500/30 text-green-400 font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-green-500/30">
                          {ALGORITHM_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value} className="text-green-400 font-mono">
                              <div>
                                <div className="font-bold">{option.label}</div>
                                <div className="text-xs text-gray-400">{option.fullName}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {algorithm === "rr" && (
                        <div className="space-y-2">
                          <Label className="text-green-400 text-xs">TIME_QUANTUM</Label>
                          <Input
                            type="number"
                            value={timeQuantum}
                            onChange={(e) => setTimeQuantum(Number(e.target.value))}
                            className="bg-black/70 border-green-500/30 text-green-400 font-mono"
                            min="1"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Process Configuration */}
                  <Card className="bg-black/50 border-purple-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-purple-400 text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          PROCESSES [{processes.length}]
                        </div>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={generateRandomProcesses}
                                size="sm"
                                variant="ghost"
                                className="text-purple-400 hover:bg-purple-400/10 h-6 w-6 p-0"
                              >
                                <Shuffle className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Generate Random (Ctrl+G)</TooltipContent>
                          </Tooltip>
                          <Button
                            onClick={addProcess}
                            size="sm"
                            variant="ghost"
                            className="text-purple-400 hover:bg-purple-400/10 h-6 w-6 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {processes.map((process, index) => (
                          <div key={process.id} className="p-3 bg-black/30 rounded border border-gray-700/50 hover:border-purple-500/50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <Badge 
                                className="bg-purple-600/20 text-purple-400 border-purple-500/30 font-mono"
                                style={{ 
                                  backgroundColor: `${PROCESS_COLORS[index % PROCESS_COLORS.length]}20`,
                                  borderColor: `${PROCESS_COLORS[index % PROCESS_COLORS.length]}50`
                                }}
                              >
                                {process.id}
                              </Badge>
                              {processes.length > 1 && (
                                <Button
                                  onClick={() => removeProcess(process.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-600/10 h-6 w-6 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <Label className="text-gray-400 text-xs">ARRIVAL</Label>
                                <Input
                                  type="number"
                                  value={process.arrivalTime}
                                  onChange={(e) => updateProcess(process.id, 'arrivalTime', Number(e.target.value))}
                                  className="bg-black/50 border-gray-600/30 text-green-400 h-7 font-mono"
                                  min="0"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-400 text-xs">BURST</Label>
                                <Input
                                  type="number"
                                  value={process.burstTime}
                                  onChange={(e) => updateProcess(process.id, 'burstTime', Number(e.target.value))}
                                  className="bg-black/50 border-gray-600/30 text-green-400 h-7 font-mono"
                                  min="1"
                                />
                              </div>
                              {algorithm.includes('priority') && (
                                <div className="col-span-2">
                                  <Label className="text-gray-400 text-xs">PRIORITY</Label>
                                  <Input
                                    type="number"
                                    value={process.priority || 0}
                                    onChange={(e) => updateProcess(process.id, 'priority', Number(e.target.value))}
                                    className="bg-black/50 border-gray-600/30 text-green-400 h-7 font-mono"
                                    min="0"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Control Buttons */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={isSimulating ? togglePause : startSimulation}
                            className="flex-1 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-black font-bold font-mono"
                          >
                            {isSimulating ? (isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />) : <Play className="w-4 h-4 mr-2" />}
                            {isSimulating ? (isPaused ? 'RESUME' : 'PAUSE') : 'EXECUTE'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Start/Pause (Ctrl+Space)</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={resetSimulation}
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-600/10"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reset (Ctrl+R)</TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs">SIMULATION_SPEED</Label>
                      <input
                        type="range"
                        min="100"
                        max="2000"
                        step="100"
                        value={simulationSpeed}
                        onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                      <div className="text-xs text-gray-400 text-center">{simulationSpeed}ms</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Visualization Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-gray-900/90 backdrop-blur-sm border-b border-cyan-500/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-cyan-400" />
                    <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                      CPU_SCHEDULER_VISUALIZER
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-mono">TIME: {currentTime.toString().padStart(3, '0')}</span>
                    {currentExecutingProcess && (
                      <>
                        <Separator orientation="vertical" className="h-4 bg-gray-600" />
                        <span className="text-green-400 font-mono">EXECUTING: {currentExecutingProcess}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowGantt(!showGantt)}
                    variant="ghost"
                    size="sm"
                    className="text-cyan-400 hover:bg-cyan-400/10"
                  >
                    {showGantt ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showGantt ? 'HISTOGRAM' : 'GANTT'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Visualization Content */}
            <div className="flex-1 p-6 overflow-auto">
              <Card className="bg-black/50 border-cyan-500/30 h-full">
                <CardHeader>
                  <CardTitle className="text-cyan-400 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {showGantt ? 'GANTT_CHART' : 'HISTOGRAM_VISUALIZER'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full">
                  {histogramBars.length > 0 ? (
                    <div className="h-full flex flex-col">
                      {/* Time Scale */}
                      <div className="relative h-8 mb-4 bg-black/30 rounded border border-gray-700/50">
                        {Array.from({ length: maxTime + 1 }, (_, i) => (
                          <div
                            key={i}
                            className="absolute top-0 h-full flex items-center justify-center text-xs text-gray-400 border-l border-gray-600/30"
                            style={{ left: `${(i / maxTime) * 100}%`, width: `${100 / maxTime}%` }}
                          >
                            {i}
                          </div>
                        ))}
                      </div>

                      {/* Histogram Bars */}
                      <div className="flex-1 relative">
                        {showGantt ? (
                          // Traditional Gantt Chart
                          <div className="relative h-16 bg-black/30 rounded border border-gray-700/50">
                            {histogramBars.map((bar, index) => (
                              <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`absolute top-2 bottom-2 rounded flex items-center justify-center font-bold text-black transition-all duration-300 border-2 ${bar.isActive ? 'animate-pulse' : ''}`}
                                    style={{
                                      left: `${(bar.startTime / maxTime) * 100}%`,
                                      width: `${((bar.endTime - bar.startTime) / maxTime) * 100}%`,
                                      backgroundColor: bar.color,
                                      borderColor: bar.color,
                                      boxShadow: `0 0 20px ${bar.color}50`,
                                    }}
                                  >
                                    {bar.processId}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-900 border-cyan-500/30">
                                  <div className="text-xs font-mono">
                                    <div>Process: {bar.processId}</div>
                                    <div>Start: {bar.startTime}</div>
                                    <div>End: {bar.endTime}</div>
                                    <div>Duration: {bar.targetLength}</div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        ) : (
                          // Histogram View
                          <div className="flex items-end justify-center h-full gap-2 p-4">
                            {histogramBars.map((bar, index) => (
                              <Tooltip key={index}>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center gap-2">
                                    <div
                                      className={`w-12 bg-gradient-to-t rounded-t transition-all duration-500 border-2 ${bar.isActive ? 'animate-pulse shadow-lg' : ''}`}
                                      style={{
                                        height: `${(bar.currentLength / Math.max(...histogramBars.map(b => b.targetLength))) * 200}px`,
                                        backgroundColor: bar.color,
                                        borderColor: bar.color,
                                        boxShadow: bar.isActive ? `0 0 20px ${bar.color}` : 'none',
                                      }}
                                    />
                                    <div className="text-xs text-gray-400 font-mono">{bar.processId}</div>
                                    <div className="text-xs text-green-400 font-mono">{bar.currentLength.toFixed(1)}</div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-900 border-cyan-500/30">
                                  <div className="text-xs font-mono">
                                    <div>Process: {bar.processId}</div>
                                    <div>Start Time: {bar.startTime}</div>
                                    <div>End Time: {bar.endTime}</div>
                                    <div>Burst Time: {bar.targetLength}</div>
                                    <div>Progress: {((bar.currentLength / bar.targetLength) * 100).toFixed(1)}%</div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <div className="font-mono">{'>'} AWAITING_EXECUTION...</div>
                        <div className="text-sm mt-2">Press EXECUTE to start visualization</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Panel - Metrics */}
          <div className={`transition-all duration-500 ${rightPanelCollapsed ? 'w-12' : 'w-80'} bg-gray-900/90 backdrop-blur-sm border-l border-cyan-500/30`}>
            <div className="p-4 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className={`flex items-center gap-2 ${rightPanelCollapsed ? 'hidden' : ''}`}>
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-lg font-bold text-yellow-400">ANALYTICS</h2>
                </div>
                <Button
                  onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                  variant="ghost"
                  size="sm"
                  className="text-yellow-400 hover:bg-yellow-400/10"
                >
                  <Activity className="w-4 h-4" />
                </Button>
              </div>

              {!rightPanelCollapsed && (
                <div className="space-y-6">
                  {/* Algorithm Info */}
                  <Card className="bg-black/50 border-yellow-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-yellow-400 text-sm">ALGORITHM_INFO</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div>
                        <div className="text-gray-400">NAME:</div>
                        <div className="text-green-400 font-mono">{ALGORITHM_INFO[algorithm]?.name}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">TIME_COMPLEXITY:</div>
                        <div className="text-cyan-400 font-mono">{ALGORITHM_INFO[algorithm]?.timeComplexity}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">SPACE_COMPLEXITY:</div>
                        <div className="text-purple-400 font-mono">{ALGORITHM_INFO[algorithm]?.spaceComplexity}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">DESCRIPTION:</div>
                        <div className="text-gray-300 text-xs">{ALGORITHM_INFO[algorithm]?.description}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Metrics */}
                  {histogramBars.length > 0 && (
                    <Card className="bg-black/50 border-green-500/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-green-400 text-sm">PERFORMANCE_METRICS</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="p-3 bg-green-600/10 rounded border border-green-500/30">
                            <div className="text-green-400 font-bold text-xs">AVG_WAITING_TIME</div>
                            <div className="text-xl text-green-300 font-mono">{metrics.avgWaitingTime.toFixed(2)}</div>
                          </div>
                          <div className="p-3 bg-cyan-600/10 rounded border border-cyan-500/30">
                            <div className="text-cyan-400 font-bold text-xs">AVG_TURNAROUND_TIME</div>
                            <div className="text-xl text-cyan-300 font-mono">{metrics.avgTurnaroundTime.toFixed(2)}</div>
                          </div>
                          <div className="p-3 bg-purple-600/10 rounded border border-purple-500/30">
                            <div className="text-purple-400 font-bold text-xs">AVG_RESPONSE_TIME</div>
                            <div className="text-xl text-purple-300 font-mono">{metrics.avgResponseTime.toFixed(2)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Process Table */}
                  <Card className="bg-black/50 border-purple-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-purple-400 text-sm">PROCESS_TABLE</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs font-mono">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left p-1 text-purple-400">PID</th>
                              <th className="text-left p-1 text-purple-400">AT</th>
                              <th className="text-left p-1 text-purple-400">BT</th>
                              <th className="text-left p-1 text-purple-400">CT</th>
                              <th className="text-left p-1 text-purple-400">WT</th>
                              <th className="text-left p-1 text-purple-400">TAT</th>
                            </tr>
                          </thead>
                          <tbody>
                            {processes.map((process, index) => (
                              <tr key={process.id} className="border-b border-gray-800/50">
                                <td className="p-1">
                                  <Badge 
                                    className="text-xs px-1 py-0"
                                    style={{ 
                                      backgroundColor: `${PROCESS_COLORS[index % PROCESS_COLORS.length]}20`,
                                      color: PROCESS_COLORS[index % PROCESS_COLORS.length],
                                      borderColor: `${PROCESS_COLORS[index % PROCESS_COLORS.length]}50`
                                    }}
                                  >
                                    {process.id}
                                  </Badge>
                                </td>
                                <td className="p-1 text-gray-300">{process.arrivalTime}</td>
                                <td className="p-1 text-gray-300">{process.burstTime}</td>
                                <td className="p-1 text-gray-300">{process.completionTime || '-'}</td>
                                <td className="p-1 text-gray-300">{process.waitingTime || '-'}</td>
                                <td className="p-1 text-gray-300">{process.turnaroundTime || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Keyboard Shortcuts */}
                  <Card className="bg-black/50 border-gray-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-gray-400 text-sm">SHORTCUTS</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ctrl+Space</span>
                        <span className="text-green-400">Start/Pause</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ctrl+R</span>
                        <span className="text-green-400">Reset</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ctrl+G</span>
                        <span className="text-green-400">Random</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 bg-gray-900/95 backdrop-blur-sm border-t border-cyan-500/30 mt-auto">
          <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Project Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-lg font-bold text-cyan-400 font-mono">CPU_SCHEDULER</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Interactive CPU scheduling algorithms visualizer with cyberpunk aesthetics. 
                  Perfect for learning operating system concepts.
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Made with</span>
                  <Heart className="w-3 h-3 text-red-400 animate-pulse" />
                  <span>by the CPU Scheduler Team</span>
                </div>
              </div>

              {/* Algorithms */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-green-400 font-mono uppercase tracking-wider">
                  Algorithms
                </h4>
                <ul className="space-y-2 text-sm">
                  {ALGORITHM_OPTIONS.map((algo) => (
                    <li key={algo.value}>
                      <button
                        onClick={() => setAlgorithm(algo.value)}
                        className="text-gray-400 hover:text-cyan-400 transition-colors font-mono text-xs"
                      >
                        {algo.label} - {algo.fullName}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-purple-400 font-mono uppercase tracking-wider">
                  Features
                </h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <span className="text-xs font-mono">Real-time Visualization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <span className="text-xs font-mono">Interactive Process Management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <span className="text-xs font-mono">Performance Metrics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <span className="text-xs font-mono">Keyboard Shortcuts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                    <span className="text-xs font-mono">Responsive Design</span>
                  </li>
                </ul>
              </div>

              {/* Links & Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-yellow-400 font-mono uppercase tracking-wider">
                  Resources
                </h4>
                <div className="space-y-3">
                  <a
                    href="https://github.com/your-username/cpu-scheduler-visualizer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors text-xs font-mono"
                  >
                    <Github className="w-4 h-4" />
                    <span>Source Code</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://github.com/your-username/cpu-scheduler-visualizer/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors text-xs font-mono"
                  >
                    <span>Report Issues</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://github.com/your-username/cpu-scheduler-visualizer/wiki"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors text-xs font-mono"
                  >
                    <span>Documentation</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Tech Stack */}
                <div className="pt-4 border-t border-gray-800">
                  <h5 className="text-xs font-bold text-gray-500 font-mono mb-2">TECH_STACK</h5>
                  <div className="flex flex-wrap gap-1">
                    {['Next.js', 'React', 'Tailwind', 'Radix UI'].map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 bg-gray-800/50 text-gray-400 text-xs font-mono rounded border border-gray-700/50"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                <span>© 2024 CPU Scheduler Visualizer</span>
                <span className="hidden md:inline">•</span>
                <span>MIT License</span>
                <span className="hidden md:inline">•</span>
                <span>v1.0.0</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>System Online</span>
                </div>
                <div className="text-xs text-gray-500 font-mono">
                  Build: {new Date().toISOString().split('T')[0]}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Matrix Effect */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="matrix-bg"></div>
          </div>
        </footer>

        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
          
          body {
            font-family: 'Share Tech Mono', monospace;
          }
          
          .matrix-bg {
            background-image: 
              linear-gradient(rgba(0,255,0,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,0,0.03) 1px, transparent 1px);
            background-size: 20px 20px;
            animation: matrix-scroll 20s linear infinite;
            height: 100%;
            width: 100%;
          }
          
          @keyframes matrix-scroll {
            0% { transform: translateY(0); }
            100% { transform: translateY(20px); }
          }
          
          .scanlines {
            background: linear-gradient(
              transparent 50%,
              rgba(0, 255, 0, 0.03) 50%
            );
            background-size: 100% 4px;
            height: 100%;
            width: 100%;
            animation: scanlines 0.1s linear infinite;
          }
          
          @keyframes scanlines {
            0% { background-position: 0 0; }
            100% { background-position: 0 4px; }
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.3);
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0,255,255,0.3);
            border-radius: 3px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0,255,255,0.5);
          }
        `}</style>
      </div>
    </TooltipProvider>
  )
}
