import * as THREE from 'three'

export function chunk (arr, len) {
  var chunks = [],
      i = 0,
      n = arr.length
  while (i < n) {
    chunks.push(arr.slice(i, i += len))
  }
  return chunks
}

export function indexOfMax(arr) {
  if (arr.length === 0) {
      return -1
  }

  var max = arr[0]
  var maxIndex = 0

  for (var i = 1; i < arr.length; i++) {
      if (arr[i] > max) {
          maxIndex = i
          max = arr[i]
      }
  }

  return maxIndex
}

export function toScreenPosition(v, camera) {

  var widthHalf = 0.5
  var heightHalf = 0.5

  v.project(camera)

  v.x = - ( v.x * widthHalf ) + widthHalf
  v.y = - ( v.y * heightHalf ) + heightHalf

  return v
}

export function map(n, start1, stop1, start2, stop2) {
  return (n - start1) / (stop1 - start1) * (stop2 - start2) + start2
}