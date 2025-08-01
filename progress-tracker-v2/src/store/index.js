import { configureStore } from '@reduxjs/toolkit'
import progressReducer from './progressSlice'
import reflectionReducer from './reflectionSlice'
import goalsReducer from './goalsSlice'

export const store = configureStore({
  reducer: {
    progress: progressReducer,
    reflection: reflectionReducer,
    goals: goalsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    })
})
