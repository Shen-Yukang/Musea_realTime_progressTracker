import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  data: [],
  loading: false,
  error: null
}

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setProgressData: (state, action) => {
      state.data = action.payload
      state.loading = false
      state.error = null
    },
    addProgress: (state, action) => {
      state.data.push(action.payload)
    },
    updateProgress: (state, action) => {
      const index = state.data.findIndex(item => item.date === action.payload.date)
      if (index !== -1) {
        state.data[index] = action.payload
      }
    },
    deleteProgress: (state, action) => {
      state.data = state.data.filter(item => item.date !== action.payload)
    },
    setError: (state, action) => {
      state.error = action.payload
      state.loading = false
    }
  }
})

export const {
  setLoading,
  setProgressData,
  addProgress,
  updateProgress,
  deleteProgress,
  setError
} = progressSlice.actions

export default progressSlice.reducer
