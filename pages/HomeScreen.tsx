import { useEffect, useState } from "react";
import { View, Text, FlatList, Alert, TouchableOpacity, Image, StyleSheet, RefreshControl } from "react-native";
import { supabase } from "../supabase/supabaseClient";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen({ navigation }: any) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const loadEntries = async () => {
    setRefreshing(true);
    const { data } = await supabase.from("entries").select("*").order("created_at", { ascending: false });
    setEntries(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (isFocused) loadEntries();
  }, [isFocused]);

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Excluir", `Deseja excluir "${title}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await supabase.from("entries").delete().eq("id", id);
          loadEntries();
        }
      }
    ]);
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.replace("Login");
        }
      }
    ]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Anotações</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Ionicons name="exit-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate("EntryEdit")}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de Entradas */}
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadEntries}
            colors={["#6366f1"]}
            tintColor="#6366f1"
          />
        }
        contentContainerStyle={entries.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>Nenhuma anotação encontrada</Text>
            <Text style={styles.emptySubtext}>Toque no + para criar uma nova</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.entryCard}
            onPress={() => navigation.navigate("EntryEdit", { entry: item })}
          >
            <View style={styles.entryHeader}>
              <Text style={styles.entryTitle} numberOfLines={1}>{item.title || "Sem título"}</Text>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id, item.title)}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
            
            {item.content ? (
              <Text style={styles.entryContent} numberOfLines={3}>{item.content}</Text>
            ) : (
              <Text style={styles.entryEmptyContent}>Sem conteúdo...</Text>
            )}
            
            {item.media_url && (
              <Image
                source={{ uri: item.media_url }}
                style={styles.media}
                resizeMode="cover"
              />
            )}
            
            <Text style={styles.entryDate}>{formatDate(item.created_at)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#1a1a1a",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "System",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
  },
  addButton: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#888",
    marginTop: 16,
    fontFamily: "System",
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    fontFamily: "System",
  },
  entryCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
    fontFamily: "System",
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  entryContent: {
    fontSize: 14,
    color: "#ccc",
    lineHeight: 20,
    fontFamily: "System",
  },
  entryEmptyContent: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    fontFamily: "System",
  },
  media: {
    width: "100%",
    height: 200,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 12,
  },
  entryDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    fontFamily: "System",
  },
});