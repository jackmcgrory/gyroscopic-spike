import { useCallback, useEffect, useState } from 'react'
import { isIOS } from 'react-device-detect'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

type AngularVelocity = {
  x: number | null
  y: number | null
  z: number | null
}

type ChartPoint = {
  timestamp: number
  x: number
  y: number
  z: number
}

type SpikePoint = {
  timestamp: number
  value: number
}

type MotionPermissionResult = 'granted' | 'denied'

type MotionEventConstructorWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<MotionPermissionResult>
}

const EMPTY_ANGULAR_VELOCITY: AngularVelocity = {
  x: null,
  y: null,
  z: null,
}

const MAX_POINTS = 100

const hasDeviceMotionSupport = () =>
  typeof window !== 'undefined' &&
  typeof window.DeviceMotionEvent !== 'undefined'

const getMotionEventConstructor = () =>
  window.DeviceMotionEvent as MotionEventConstructorWithPermission

export const ComponentWithGyroscope = () => {
  const [angularVelocity, setAngularVelocity] =
    useState<AngularVelocity>(EMPTY_ANGULAR_VELOCITY)

  const [gyroData, setGyroData] = useState<ChartPoint[]>([])
  const [spikeData, setSpikeData] = useState<SpikePoint[]>([])

  const [isListening, setIsListening] = useState(false)
  const [status, setStatus] = useState('Checking sensor support...')

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    // -------- GYRO --------
    const gx = event.rotationRate?.beta ?? 0
    const gy = event.rotationRate?.gamma ?? 0
    const gz = event.rotationRate?.alpha ?? 0

    setAngularVelocity({ x: gx, y: gy, z: gz })

    setGyroData(prev => {
      const next = [
        ...prev,
        {
          timestamp: Date.now(),
          x: gx,
          y: gy,
          z: gz,
        },
      ]
      return next.slice(-MAX_POINTS)
    })

    // -------- ACCEL SPIKE (MAGNITUDE - GRAVITY) --------
    const ax = event.accelerationIncludingGravity?.x ?? 0
    const ay = event.accelerationIncludingGravity?.y ?? 0
    const az = event.accelerationIncludingGravity?.z ?? 0

    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az)

    const spike = Math.abs(magnitude - 9.8)

    setSpikeData(prev => {
      const next = [
        ...prev,
        {
          timestamp: Date.now(),
          value: spike,
        },
      ]
      return next.slice(-MAX_POINTS)
    })
  }, [])

  const stopListening = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion)
    setIsListening(false)
    setStatus('Stopped.')
  }, [handleMotion])

  const startListening = useCallback(() => {
    if (!hasDeviceMotionSupport()) {
      setStatus('No motion support on this device.')
      return false
    }

    window.addEventListener('devicemotion', handleMotion)

    setIsListening(true)
    setStatus('Listening for motion...')
    return true
  }, [handleMotion])

  const requestPermissionAndStart = useCallback(async () => {
    if (!hasDeviceMotionSupport()) {
      setStatus('No motion support on this device.')
      return false
    }

    const deviceMotionEvent = getMotionEventConstructor()

    if (
      isIOS &&
      typeof deviceMotionEvent.requestPermission === 'function'
    ) {
      setStatus('Requesting iOS permission...')

      try {
        const permission =
          await deviceMotionEvent.requestPermission()

        if (permission !== 'granted') {
          setStatus('Permission denied.')
          return false
        }
      } catch {
        setStatus('Permission error.')
        return false
      }
    }

    return startListening()
  }, [startListening])

  useEffect(() => {
    if (!hasDeviceMotionSupport()) {
      setStatus('No motion support.')
      return
    }

    if (!isIOS) {
      startListening()
    }

    return () => {
      stopListening()
    }
  }, [startListening, stopListening])

  return (
    <div style={{ padding: 24 }}>
      <h2>Motion Spike Detector</h2>

      <p>{status}</p>

      {isIOS && !isListening && (
        <button onClick={() => void requestPermissionAndStart()}>
          Enable Motion Sensors
        </button>
      )}

      {isListening && (
        <button onClick={stopListening}>
          Stop
        </button>
      )}

      {/* -------- GYROSCOPE VALUES -------- */}
      <div style={{ marginTop: 24 }}>
        <h3>Gyroscope</h3>
        <p>X: {angularVelocity.x?.toFixed(1)}</p>
        <p>Y: {angularVelocity.y?.toFixed(1)}</p>
        <p>Z: {angularVelocity.z?.toFixed(1)}</p>
      </div>

      {/* -------- GYROSCOPE CHART -------- */}
      <div style={{ width: '100%', height: 300, marginTop: 24 }}>
        <h3>Gyroscope Chart</h3>
        <ResponsiveContainer>
          <LineChart data={gyroData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="x" stroke="#8884d8" dot={false} />
            <Line dataKey="y" stroke="#82ca9d" dot={false} />
            <Line dataKey="z" stroke="#ff7300" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* -------- SPIKE CHART -------- */}
      <div style={{ width: '100%', height: 300, marginTop: 24 }}>
        <h3>Motion Spike (|accel magnitude - gravity|)</h3>

        <ResponsiveContainer>
          <LineChart data={spikeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              dataKey="value"
              stroke="#ff7300"
              dot={false}
              name="Spike Strength"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ComponentWithGyroscope