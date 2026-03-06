import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, FlatList, TouchableOpacity, Platform, Modal, ActivityIndicator } from "react-native";
import { Video } from "expo-av";
import { useRouter } from "expo-router";
import { ChevronDown } from "lucide-react-native";

const GRADES = ["", "V0","V1","V2","V3","V4","V5","V6","V7","V8","V9"] as const;
type Grade = typeof GRADES[number];

function getBackendBase() {
  // For production, use environment variable or Railway URL
  if (__DEV__) {
    if (Platform.OS === "android") return "http://10.0.2.2:3002";
    return "http://localhost:3002";
  }
  // Replace with your Railway URL in production
  return process.env.EXPO_PUBLIC_BACKEND_URL || "https://your-railway-app.up.railway.app";
}

export default function FeedScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [city, setCity] = useState("");
  const [gym, setGym] = useState("");
  const [grade, setGrade] = useState<Grade>("");
  const [gradeModalVisible, setGradeModalVisible] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    setLoading(true);
    try {
      const base = getBackendBase();
      const params = new URLSearchParams();
      if (city.trim()) params.append("city", city.trim());
      if (gym.trim()) params.append("gym", gym.trim());
      if (grade) params.append("grade", grade as string);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${base}/videos${qs}`);
      const data = await res.json();
      setVideos(data);
    } catch (e) {
      console.error("Failed to fetch videos", e);
    } finally {
      setLoading(false);
    }
  }

  function renderItem({ item }: { item: any }) {
    const base = getBackendBase();
    const uri = item.url.startsWith("http") ? item.url : `${base}${item.url}`;
    return (
      <View style={styles.card}>
        <Text style={styles.meta}>{item.city} · {item.gym} · {item.grade}</Text>
        <Video
          source={{ uri }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
        />
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>BoulderShare</Text>
        <Button title="上传" onPress={() => router.push("/upload")} />
      </View>

      <View style={styles.filters}>
        <TextInput placeholder="城市" value={city} onChangeText={setCity} style={styles.input} />
        <TextInput placeholder="馆名" value={gym} onChangeText={setGym} style={styles.input} />
        <TouchableOpacity style={styles.gradeSelector} onPress={() => setGradeModalVisible(true)}>
          <Text style={{ color: grade ? "#000" : "#666" }}>{grade || "等级 (V0-V9)"}</Text>
          <ChevronDown size={18} color="#333" />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <Button title="搜索" onPress={fetchVideos} />
          <Button title="重置" onPress={() => { setCity(""); setGym(""); setGrade(""); fetchVideos(); }} />
        </View>
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
        <FlatList
          data={videos}
          keyExtractor={(v) => String(v.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      <Modal visible={gradeModalVisible} animationType="slide" onRequestClose={() => setGradeModalVisible(false)}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>选择等级</Text>
          {GRADES.filter(g => g !== "").map(g => (
            <TouchableOpacity key={g} style={styles.gradeItem} onPress={() => { setGrade(g as Grade); setGradeModalVisible(false); }}>
              <Text style={{ fontSize: 18 }}>{g}</Text>
            </TouchableOpacity>
          ))}
          <Button title="取消" onPress={() => setGradeModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "700" },
  filters: { marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#eee", padding: 8, borderRadius: 6, marginTop: 8 },
  gradeSelector: { marginTop: 8, padding: 10, borderWidth: 1, borderColor: "#eee", borderRadius: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  card: { marginBottom: 16, borderWidth: 1, borderColor: "#f0f0f0", borderRadius: 8, padding: 8 },
  meta: { fontSize: 14, color: "#333", marginBottom: 8 },
  video: { width: "100%", height: 200, backgroundColor: "#000" },
  timestamp: { fontSize: 12, color: "#666", marginTop: 6 },
  modal: { flex: 1, padding: 16, backgroundColor: "#fff" },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  gradeItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
});