import { useEffect, useState } from 'react'
import useGyroscope from 'react-hook-gyroscope'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type GyroPoint = {
  time: number
  x: number
  y: number
  z: number
}

const MAX_POINTS = 100

export const ComponentWithGyroscope = () => {
  const gyroscope = useGyroscope()
  const [data, setData] = useState<GyroPoint[]>([])

  useEffect(() => {
    if (gyroscope.error) return

    setData(prev => {
      const next = [
        ...prev,
        {
          time: Date.now(),
          x: gyroscope.x ?? 0,
          y: gyroscope.y ?? 0,
          z: gyroscope.z ?? 0,
        },
      ]

      return next.slice(-MAX_POINTS)
    })
  }, [gyroscope.x, gyroscope.y, gyroscope.z, gyroscope.error])

  if (gyroscope.error) {
    return <p>No gyroscope, sorry.</p>
  }

  return (
    <div>
      <ul>
        <li>X: {gyroscope.x}</li>
        <li>Y: {gyroscope.y}</li>
        <li>Z: {gyroscope.z}</li>
      </ul>

      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
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
              name="X"
            />

            <Line
              type="monotone"
              dataKey="y"
              stroke="#82ca9d"
              dot={false}
              name="Y"
            />

            <Line
              type="monotone"
              dataKey="z"
              stroke="#ff7300"
              dot={false}
              name="Z"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}