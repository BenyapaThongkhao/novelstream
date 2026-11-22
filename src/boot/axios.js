import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.QCLI_API_URL || 'https://6b0244994a8cad87bd8fa13d.mockapi.io/novels'
})

export default ({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
}

export { api }