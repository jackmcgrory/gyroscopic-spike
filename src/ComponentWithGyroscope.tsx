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
  time: number
  x: number
  y: number
  z: number
}

const MAX_POINTS = 100

export const ComponentWithGyroscope = () => {
  const [angularVelocity, setAngularVelocity] = useState<AngularVelocity>({
    x: null,
    y: null,
    z: null,
  })

  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [isListening, setIsListening] = useState(false)
  const [status, setStatus] = useState('Checking sensor support...')

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const x = event.rotationRate?.beta ?? 0
    const y = event.rotationRate?.gamma ?? 0
    const z = event.rotationRate?.alpha ?? 0

    setAngularVelocity({ x, y, z })

    setChartData(prev => {
      const next = [
        ...prev,
        {
          time: Date.now(),
          x,
          y,
          z,
        },
      ]

      return next.slice(-MAX_POINTS)
    })
  }, [])

  const startListening = useCallback(() => {
    window.addEventListener('devicemotion', handleMotion)
    setIsListening(true)
    setStatus('Listening for gyroscope updates.')
  }, [handleMotion])

  const stopListening = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion)
    setIsListening(false)
  }, [handleMotion])

  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion)
    }
  }, [handleMotion])

  return (
    <div style={{ padding: 24 }}>
      <h2>Gyroscope Spike</h2>

      <p>{status}</p>

      {!isListening ? (
        <button onClick={startListening}>
          {isIOS ? 'Enable Gyroscope' : 'Start Gyroscope'}
        </button>
      ) : (
        <button onClick={stopListening}>
          Stop Gyroscope
        </button>
      )}

      <div style={{ marginTop: 24 }}>
        <p>X: {angularVelocity.x?.toFixed(2)}</p>
        <p>Y: {angularVelocity.y?.toFixed(2)}</p>
        <p>Z: {angularVelocity.z?.toFixed(2)}</p>
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
              dataKey="time"
              tickFormatter={(value) =>
                new Date(value).toLocaleTimeString()
              }
            />

            <YAxis />

            <Tooltip
              labelFormatter={(value) =>
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