import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  data: [],
  loading: false,
  error: null
}

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setGoalsData: (state, action) => {
      state.data = action.payload
      state.loading = false
      state.error = null
    },
    addGoal: (state, action) => {
      state.data.push(action.payload)
    },
    updateGoal: (state, action) => {
      const index = state.data.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        state.data[index] = action.payload
      }
    },
    deleteGoal: (state, action) => {
      state.data = state.data.filter(item => item.id !== action.payload)
    },
    setError: (state, action) => {
      state.error = action.payload
      state.loading = false
    }
  }
})

export const {
  setLoading,
  setGoalsData,
  addGoal,
  updateGoal,
  deleteGoal,
  setError
} = goalsSlice.actions

export default goalsSlice.reducer
