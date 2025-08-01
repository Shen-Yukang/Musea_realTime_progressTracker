import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  data: [],
  loading: false,
  error: null
}

const reflectionSlice = createSlice({
  name: 'reflection',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setReflectionData: (state, action) => {
      state.data = action.payload
      state.loading = false
      state.error = null
    },
    addReflection: (state, action) => {
      state.data.push(action.payload)
    },
    updateReflection: (state, action) => {
      const index = state.data.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        state.data[index] = action.payload
      }
    },
    deleteReflection: (state, action) => {
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
  setReflectionData,
  addReflection,
  updateReflection,
  deleteReflection,
  setError
} = reflectionSlice.actions

export default reflectionSlice.reducer
