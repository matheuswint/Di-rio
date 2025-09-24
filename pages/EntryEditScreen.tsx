import { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Text, Alert, Image, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../supabase/supabaseClient";
import { decode } from "base64-arraybuffer";
import { Ionicons } from "@expo/vector-icons";

export default function EntryEditScreen({ navigation, route }: any) {
  const editingEntry = route.params?.entry;
  const [title, setTitle] = useState(editingEntry?.title || "");
  const [content, setContent] = useState(editingEntry?.content || "");
  const [media, setMedia] = useState<string | null>(editingEntry?.media_url || null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  const pickMedia = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permissão necessária", "Precisamos de acesso à sua galeria para adicionar mídia.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && userId) {
      setLoading(true);
      try {
        const asset = result.assets[0];
        const fileExt = asset.fileName?.split(".").pop() || (asset.type === "video" ? "mp4" : "png");
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const mimeType = asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/png");

        const { error } = await supabase.storage
          .from("diary-media")
          .upload(`entries/${fileName}`, decode(asset.base64!), {
            contentType: mimeType,
            upsert: true,
          });

        if (error) {
          Alert.alert("Erro", error.message);
          return;
        }

        const { data } = supabase.storage.from("diary-media").getPublicUrl(`entries/${fileName}`);
        setMedia(data.publicUrl);
      } catch (error) {
        Alert.alert("Erro", "Falha ao fazer upload da mídia");
      } finally {
        setLoading(false);
      }
    }
  };

  const removeMedia = () => {
    setMedia(null);
  };

  const saveEntry = async () => {
    if (!userId) {
      Alert.alert("Erro", "Usuário não identificado");
      return;
    }

    if (!title.trim() && !content.trim()) {
      Alert.alert("Aviso", "Adicione um título ou conteúdo para salvar");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: editingEntry?.id,
        user_id: userId,
        title: title.trim(),
        content: content.trim(),
        media_url: media,
      };

      const { error } = await supabase.from("entries").upsert(payload);
      
      if (error) {
        Alert.alert("Erro", error.message);
      } else {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar a anotação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editingEntry ? "Editar Anotação" : "Nova Anotação"}
          </Text>
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={saveEntry}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Salvando..." : "Salvar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            placeholder="Título"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
            style={styles.titleInput}
            maxLength={100}
          />
          
          <TextInput
            placeholder="Conteúdo da anotação..."
            placeholderTextColor="#666"
            value={content}
            onChangeText={setContent}
            style={styles.contentInput}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />
          
          {/* Contadores de caracteres */}
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {title.length}/100
            </Text>
            <Text style={styles.counterText}>
              {content.length}/2000
            </Text>
          </View>

          {/* Mídia */}
          {media && (
            <View style={styles.mediaContainer}>
              <Image source={{ uri: media }} style={styles.mediaPreview} />
              <TouchableOpacity style={styles.removeMediaButton} onPress={removeMedia}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          {/* Botões de Ação */}
          <TouchableOpacity 
            style={styles.mediaButton}
            onPress={pickMedia}
            disabled={loading}
          >
            <Ionicons name="image-outline" size={20} color="#6366f1" />
            <Text style={styles.mediaButtonText}>
              {media ? "Alterar Mídia" : "Adicionar Mídia"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#1a1a1a",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    fontFamily: "System",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#6366f1",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "System",
  },
  form: {
    padding: 20,
  },
  titleInput: {
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#333",
    padding: 16,
    borderRadius: 16,
    fontSize: 18,
    color: "#ffffff",
    marginBottom: 16,
    fontFamily: "System",
    fontWeight: "600",
  },
  contentInput: {
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#333",
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    color: "#ffffff",
    minHeight: 150,
    fontFamily: "System",
    lineHeight: 22,
  },
  counterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 20,
  },
  counterText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "System",
  },
  mediaContainer: {
    position: "relative",
    marginBottom: 16,
  },
  mediaPreview: {
    width: "100%",
    height: 200,
    borderRadius: 16,
  },
  removeMediaButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    padding: 4,
  },
  mediaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#333",
    borderStyle: "dashed",
    gap: 8,
  },
  mediaButtonText: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "System",
  },
});