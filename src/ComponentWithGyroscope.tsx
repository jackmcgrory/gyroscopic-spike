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

  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [isListening, setIsListening] = useState(false)
  const [status, setStatus] = useState('Checking sensor support...')

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const x = event.rotationRate?.beta ?? 0
    const y = event.rotationRate?.gamma ?? 0
    const z = event.rotationRate?.alpha ?? 0

    setAngularVelocity({
      x,
      y,
      z,
    })

    setChartData(prev => {
      const next = [
        ...prev,
        {
          timestamp: Date.now(),
          x,
          y,
          z,
        },
      ]

      return next.slice(-MAX_POINTS)
    })
  }, [])

  const stopListening = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion)
    setIsListening(false)
    setStatus('Gyroscope stopped.')
  }, [handleMotion])

  const startListening = useCallback(() => {
    if (!hasDeviceMotionSupport()) {
      setStatus('This device or browser does not expose gyroscope data.')
      return false
    }

    window.addEventListener('devicemotion', handleMotion)

    setIsListening(true)
    setStatus('Listening for gyroscope updates.')

    return true
  }, [handleMotion])

  const requestPermissionAndStart = useCallback(async () => {
    if (!hasDeviceMotionSupport()) {
      setStatus('This device or browser does not expose gyroscope data.')
      return false
    }

    const deviceMotionEvent = getMotionEventConstructor()

    if (
      isIOS &&
      typeof deviceMotionEvent.requestPermission === 'function'
    ) {
      setStatus('Requesting iOS motion permission...')

      try {
        const permission =
          await deviceMotionEvent.requestPermission()

        if (permission !== 'granted') {
          setStatus('Motion permission was denied.')
          return false
        }
      } catch {
        setStatus('Motion permission request failed.')
        return false
      }
    }

    return startListening()
  }, [startListening])

  useEffect(() => {
    if (!hasDeviceMotionSupport()) {
      setStatus('This device or browser does not expose gyroscope data.')
      return
    }

    if (isIOS) {
      const deviceMotionEvent = getMotionEventConstructor()

      if (typeof deviceMotionEvent.requestPermission === 'function') {
        setStatus('Tap enable to allow gyroscope access on iOS.')

        return () => {
          stopListening()
        }
      }
    }

    startListening()

    return () => {
      stopListening()
    }
  }, [startListening, stopListening])

  return (
    <div style={{ padding: 24 }}>
      <h2>Gyroscope Spike</h2>

      <p>{status}</p>

      {isIOS &&
        !isListening &&
        hasDeviceMotionSupport() && (
          <button
            onClick={() => {
              void requestPermissionAndStart()
            }}
          >
            Enable Gyroscope
          </button>
        )}

      {!isIOS &&
        !isListening &&
        hasDeviceMotionSupport() && (
          <button onClick={startListening}>
            Start Gyroscope
          </button>
        )}

      {isListening && (
        <button onClick={stopListening}>
          Stop Gyroscope
        </button>
      )}

      <div style={{ marginTop: 24 }}>
        <p>
          X Angular Velocity:{' '}
          {angularVelocity.x == null
            ? 'Waiting for data'
            : `${angularVelocity.x.toFixed(1)} deg/s`}
        </p>

        <p>
          Y Angular Velocity:{' '}
          {angularVelocity.y == null
            ? 'Waiting for data'
            : `${angularVelocity.y.toFixed(1)} deg/s`}
        </p>

        <p>
          Z Angular Velocity:{' '}
          {angularVelocity.z == null
            ? 'Waiting for data'
            : `${angularVelocity.z.toFixed(1)} deg/s`}
        </p>
      </div>

      <div
        style={{
          width: '100%',
          height: 400,
          marginTop: 32,
        }}
      >
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="timestamp"
              tickFormatter={value =>
                new Date(value).toLocaleTimeString()
              }
            />

            <YAxis />

            <Tooltip
              labelFormatter={value =>
                new Date(Number(value)).toLocaleTimeString()
              }
            />

            <Legend />

            <Line
              type="monotone"
              dataKey="x"
              stroke="#8884d8"
              dot={false}
              name="X Axis"
            />

            <Line
              type="monotone"
              dataKey="y"
              stroke="#82ca9d"
              dot={false}
              name="Y Axis"
            />

            <Line
              type="monotone"
              dataKey="z"
              stroke="#ff7300"
              dot={false}
              name="Z Axis"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ComponentWithGyroscope