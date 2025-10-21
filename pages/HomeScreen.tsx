// Arquivo: Tela inicial que lista as anotações do usuário.
// Aqui temos a lista, botões para adicionar/excluir e logout.
// Comentários explicativos foram adicionados para facilitar o entendimento.
import { useEffect, useState } from "react";
import { View, Text, FlatList, Alert, TouchableOpacity, Image, StyleSheet, RefreshControl } from "react-native";
// supabase: cliente usado para consultar/deletar dados no banco e storage
import { supabase } from "../supabase/supabaseClient";
// useIsFocused: hook que indica quando a tela está visível (útil para recarregar dados ao voltar)
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Componente principal da tela Home.
// Recebe `navigation` para navegar entre telas.
export default function HomeScreen({ navigation }: any) {
  // estado que guarda as entradas (anotações) vindas do banco
  const [entries, setEntries] = useState<any[]>([]);
  // loading inicial (pode ser usado para mostrar indicador)
  const [loading, setLoading] = useState(true);
  // refreshing controla o Pull-to-Refresh da lista
  const [refreshing, setRefreshing] = useState(false);
  // hook que indica se a tela está ativa/visível no momento
  const isFocused = useIsFocused();

  // Função que carrega as entradas do banco.
  // - seta refreshing para true para indicar operação em andamento
  // - busca todas as entradas ordenadas por created_at (mais recentes primeiro)
  // - atualiza o estado entries com os dados recebidos
  const loadEntries = async () => {
    setRefreshing(true);
    // supabase.from("entries").select("*") busca todas as colunas da tabela "entries"
    // .order("created_at", { ascending: false }) ordena do mais novo para o mais antigo
    const { data } = await supabase.from("entries").select("*").order("created_at", { ascending: false });
    // se data for null/undefined, colocamos array vazio
    setEntries(data || []);
    // indicamos que o carregamento inicial terminou
    setLoading(false);
    setRefreshing(false);
  };

  // useEffect que roda quando a tela fica em foco.
  // Assim, sempre que voltamos para a Home, recarregamos as anotações.
  useEffect(() => {
    if (isFocused) loadEntries();
  }, [isFocused]);

  // Função para excluir uma entrada.
  // Mostra um Alert para confirmar; se confirmar, deleta no Supabase e recarrega a lista.
  const handleDelete = (id: string, title: string) => {
    Alert.alert("Excluir", `Deseja excluir "${title}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          // Deleta a linha onde id === id
          await supabase.from("entries").delete().eq("id", id);
          // Recarrega as entradas para refletir a exclusão
          loadEntries();
        }
      }
    ]);
  };

  // Função para deslogar o usuário.
  // Mostra confirmação e, se confirmado, chama supabase.auth.signOut() e troca a tela para "Login".
  const handleLogout = async () => {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          // navigation.replace substitui a pilha por "Login" (não permite voltar)
          navigation.replace("Login");
        }
      }
    ]);
  };

  // Formata uma data ISO (ou string) para o formato brasileiro com hora.
  // Usa toLocaleDateString com opções para dia/mês/ano e hora/minuto.
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // JSX: estrutura visual da tela
  return (
    <View style={styles.container}>
      {/* Header: título, botão de logout e botão de adicionar nova anotação */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Anotações</Text>
        <View style={styles.headerActions}>
          {/* Botão de logout: chama handleLogout */}
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <Ionicons name="exit-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
          {/* Botão de adicionar: navega para a tela de edição/criação */}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate("EntryEdit")}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de entradas usando FlatList para performance com listas grandes */}
      <FlatList
        data={entries} // dados a serem renderizados
        keyExtractor={(item) => item.id} // chave única por item
        // refresh control para permitir pull-to-refresh
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadEntries}
            colors={["#6366f1"]}
            tintColor="#6366f1"
          />
        }
        // se não houver entradas, usamos estilos diferentes (centralizar)
        contentContainerStyle={entries.length === 0 ? styles.emptyContainer : styles.listContainer}
        // Componente exibido quando a lista está vazia
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>Nenhuma anotação encontrada</Text>
            <Text style={styles.emptySubtext}>Toque no + para criar uma nova</Text>
          </View>
        }
        // renderItem: como cada item da lista será exibido
        renderItem={({ item }) => (
          // Cada item é um card clicável que abre a tela de edição com os dados do item
          <TouchableOpacity
            style={styles.entryCard}
            onPress={() => navigation.navigate("EntryEdit", { entry: item })}
          >
            {/* Cabeçalho do card: título e botão de excluir */}
            <View style={styles.entryHeader}>
              {/* Mostra o título ou "Sem título" se estiver vazio */}
              <Text style={styles.entryTitle} numberOfLines={1}>{item.title || "Sem título"}</Text>
              {/* Botão pequeno para deletar a anotação */}
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id, item.title)}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
            
            {/* Conteúdo: mostra até 3 linhas ou texto de placeholder se vazio */}
            {item.content ? (
              <Text style={styles.entryContent} numberOfLines={3}>{item.content}</Text>
            ) : (
              <Text style={styles.entryEmptyContent}>Sem conteúdo...</Text>
            )}
            
            {/* Se houver mídia associada (imagem), mostramos uma pré-visualização */}
            {item.media_url && (
              <Image
                source={{ uri: item.media_url }}
                style={styles.media}
                resizeMode="cover"
              />
            )}
            
            {/* Data de criação/atualização formatada */}
            <Text style={styles.entryDate}>{formatDate(item.created_at)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// Estilos: definem aparência, espaçamentos e responsividade dos elementos.
// Não é necessário entender cada propriedade agora; servem para deixar a interface consistente.
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
