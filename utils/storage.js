// utils/storage.js - localStorage 适配层

const KEYS = {
  records: 'bailan_records',
  user: 'bailan_user',
  favorites: 'bailan_favorites',
  nickname: 'bailan_nickname'
}

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.records)) || []
  } catch { return [] }
}

function saveAllRecords(records) {
  localStorage.setItem(KEYS.records, JSON.stringify(records))
}

function saveRecord(record) {
  const records = getRecords()
  records.push(record)
  saveAllRecords(records)
  return records
}

function deleteRecord(timestamp) {
  const records = getRecords().filter(r => r.timestamp !== timestamp)
  saveAllRecords(records)
  return records
}

function getUserInfo() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.user)) || { nickname: '' }
  } catch { return { nickname: '' } }
}

function saveUserInfo(info) {
  localStorage.setItem(KEYS.user, JSON.stringify(info))
  return info
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.favorites)) || []
  } catch { return [] }
}

function saveFavorites(favorites) {
  localStorage.setItem(KEYS.favorites, JSON.stringify(favorites))
}

function formatDate(timestamp) {
  const d = new Date(timestamp)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = d.getHours().toString().padStart(2, '0')
  const min = d.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hour}:${min}`
}

function getDaysBetween(ts1, ts2) {
  const d1 = new Date(ts1)
  d1.setHours(0, 0, 0, 0)
  const d2 = new Date(ts2)
  d2.setHours(0, 0, 0, 0)
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
}

window.Storage = {
  getRecords, saveAllRecords, saveRecord, deleteRecord,
  getUserInfo, saveUserInfo,
  getFavorites, saveFavorites,
  formatDate, getDaysBetween
}
