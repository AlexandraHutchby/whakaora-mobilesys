import { open } from "react-native-quick-sqlite"

const db = open({
  name: "whakaora.db",
})

export default db
