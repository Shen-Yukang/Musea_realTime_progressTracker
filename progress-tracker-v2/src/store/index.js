import { configureStore } from '@reduxjs/toolkit'
import progressReducer from './progressSlice'
import reflectionReducer from './reflectionSlice'
import goalsReducer from './goalsSlice'
import realtimeReducer from './realtimeSlice'

export const store = configureStore({
  reducer: {
    progress: progressReducer,
    reflection: reflectionReducer,
    goals: goalsReducer,
    realtime: realtimeReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    })
})
