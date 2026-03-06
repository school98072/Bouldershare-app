import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Platform, TouchableOpacity, Modal, FlatList, ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { useRouter } from "expo-router";

const GRADES = ["V0","V1","V2","V3","V4","V5","V6","V7","V8","V9"] as const;
type Grade = typeof GRADES[number];

function getBackendBase() {
  if (Platform.OS === "android") return "http://10.0.2.2:3002";
  // For Expo Go on physical device, user should replace with machine IP
  return "http://localhost:3002";
}

export default function UploadScreen() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [gym, setGym] = useState("");
  const [grade, setGrade] = useState<Grade | "">("");
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);

  async function pickVideo() {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) {
      Alert.alert("权限被拒绝", "需要访问相册以选择视频");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (!result.canceled) {
      setVideoUri(result.assets?.[0]?.uri ?? null);
    }
  }

  function ensureValid(): string | null {
    if (!videoUri) return "请选择视频";
    if (!city.trim()) return "请输入城市";
    if (!gym.trim()) return "请输入馆名";
    if (!grade) return "请选择等级 (V0-V9)";
    return null;
  }

  async function upload() {
    const err = ensureValid();
    if (err) {
      Alert.alert("表单不完整", err);
      return;
    }
    setUploading(true);
    try {
      const uri = videoUri as string;
      const filename = uri.split("/").pop() || `video-${Date.now()}.mp4`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1] : "mp4";
      const mime = `video/${ext === "mov" ? "quicktime" : ext}`;

      const form = new FormData();
      // @ts-ignore - React Native FormData file shape
      form.append("video", { uri, name: filename, type: mime });
      form.append("city", city.trim());
      form.append("gym", gym.trim());
      form.append("grade", grade as string);

      const base = getBackendBase();
      const resp = await fetch(`${base}/upload`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
        },
        body: form as any,
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || `上传失败: ${resp.status}`);
      }
      const created = await resp.json();
      Alert.alert("上传成功", `Video ID: ${created.id}`);
      // Navigate back to feed
      router.push("/");
    } catch (e: any) {
      Alert.alert("上传出错", e.message || String(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>上传视频 Beta</Text>

      <Button title={videoUri ? "重新选择视频" : "从相册选择视频"} onPress={pickVideo} />
      {videoUri ? (
        <View style={styles.preview}>
          <Video
            source={{ uri: videoUri }}
            style={{ width: 300, height: 200 }}
            useNativeControls
            resizeMode={"contain" as any}
            isLooping
          />
        </View>
      ) : null}

      <TextInput placeholder="城市 (例如: Beijing)" value={city} onChangeText={setCity} style={styles.input} />
      <TextInput placeholder="馆名 (例如: Rock Hour)" value={gym} onChangeText={setGym} style={styles.input} />

      <TouchableOpacity style={styles.gradeSelector} onPress={() => setGradeModalVisible(true)}>
        <Text style={{ color: grade ? "#000" : "#666" }}>{grade || "选择等级 (V0-V9)"}</Text>
      </TouchableOpacity>

      <Button title="上传" onPress={upload} disabled={uploading} />
      {uploading && <ActivityIndicator style={{ marginTop: 12 }} />}

      <Modal visible={gradeModalVisible} animationType="slide" onRequestClose={() => setGradeModalVisible(false)}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>选择等级</Text>
          <FlatList
            data={GRADES}
            keyExtractor={(i) => i}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gradeItem}
                onPress={() => {
                  setGrade(item);
                  setGradeModalVisible(false);
                }}
              >
                <Text style={{ fontSize: 18 }}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <Button title="取消" onPress={() => setGradeModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 8, borderRadius: 6, marginTop: 8 },
  gradeSelector: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    alignItems: "center",
  },
  preview: { marginVertical: 12, alignItems: "center" },
  modal: { flex: 1, padding: 16, backgroundColor: "#fff" },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  gradeItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
});