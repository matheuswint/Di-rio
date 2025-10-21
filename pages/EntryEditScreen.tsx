import { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Text, Alert, Image, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../supabase/supabaseClient";
import { decode } from "base64-arraybuffer";
import { Ionicons } from "@expo/vector-icons";

// Componente principal da tela de criação/edição de anotações.
// Aqui nós exportamos a função que renderiza a tela e controla todo o comportamento.
// Recebe `navigation` para voltar/ir para outras telas e `route` para receber dados quando estamos editando.
export default function EntryEditScreen({ navigation, route }: any) {
  // Se vier uma anotação para edição, ela estará em route.params.entry
  const editingEntry = route.params?.entry;

  // Estados locais (useState) guardam o que o usuário digita e o que a tela precisa lembrar.
  // title: título da anotação
  const [title, setTitle] = useState(editingEntry?.title || "");
  // content: texto maior da anotação
  const [content, setContent] = useState(editingEntry?.content || "");
  // media: URL pública da imagem/vídeo associado, ou null se não tiver
  const [media, setMedia] = useState<string | null>(editingEntry?.media_url || null);
  // userId: id do usuário logado (usado para nomear uploads)
  const [userId, setUserId] = useState<string | null>(null);
  // loading: indica operações em andamento (upload/salvar), usado para desabilitar botões
  const [loading, setLoading] = useState(false);

  // useEffect roda ao montar o componente — aqui obtemos o usuário atual do Supabase.
  useEffect(() => {
    const getUser = async () => {
      // Pede ao Supabase quem é o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      // Se existir usuário, guardamos o id para usar depois em uploads e no banco
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // Função que abre a galeria para o usuário escolher imagem/video.
  const pickMedia = async () => {
    // Primeiro pedimos permissão ao sistema (Android/iOS)
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    // Se o usuário negou, avisamos e saímos
    if (!permissionResult.granted) {
      Alert.alert("Permissão necessária", "Precisamos de acesso à sua galeria para adicionar mídia.");
      return;
    }

    // Abrimos o seletor de mídia. Pedimos base64 para conseguir fazer upload ao Supabase.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // permite foto ou vídeo
      allowsEditing: true, // permite recortar/editar rápido
      quality: 0.8, // qualidade (0..1) para reduzir tamanho se possível
      base64: true, // retornará base64 que vamos converter para binário
    });

    // Se o usuário não cancelou e temos userId, prosseguimos com upload
    if (!result.canceled && userId) {
      setLoading(true); // mostramos estado de carregamento
      try {
        // A API do ImagePicker retorna um array de assets; pegamos o primeiro
        const asset = result.assets[0];

        // Determinamos a extensão do arquivo (ex: png, jpg, mp4).
        // Se fileName não existir, inferimos pela propriedade type.
        const fileExt = asset.fileName?.split(".").pop() || (asset.type === "video" ? "mp4" : "png");

        // Criamos nome único usando id do usuário e timestamp — isso evita sobrescrever arquivos.
        const fileName = `${userId}_${Date.now()}.${fileExt}`;

        // Determinamos o MIME type (ex: image/png ou video/mp4)
        const mimeType = asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/png");

        // Fazemos o upload ao bucket "galeria" dentro da pasta "entries/"
        // O Supabase espera dados binários; por isso usamos decode(base64) para transformar o base64 em ArrayBuffer.
        const { error } = await supabase.storage
          .from("galeria")
          .upload(`entries/${fileName}`, decode(asset.base64!), {
            contentType: mimeType,
            upsert: true, // substitui se já existir (não deve ocorrer por causa do nome único)
          });

        // Se houve erro no upload, mostramos uma mensagem
        if (error) {
          Alert.alert("Erro", error.message);
          return;
        }

        // Pegamos a URL pública do arquivo recém-enviado e guardamos no estado media
        const { data } = supabase.storage.from("galeria").getPublicUrl(`entries/${fileName}`);
        setMedia(data.publicUrl);
      } catch (error) {
        // Caso ocorra qualquer erro inesperado, avisamos o usuário
        Alert.alert("Erro", "Falha ao fazer upload da mídia");
      } finally {
        // Independente do resultado, tiramos o estado de carregamento
        setLoading(false);
      }
    }
  };

  // Função simples para remover a mídia da anotação (apenas localmente).
  // Observação: isto não exclui o arquivo do storage, apenas remove a referência na tela.
  const removeMedia = () => {
    setMedia(null);
  };

  // Salva a anotação no banco (cria nova ou atualiza se vier um id)
  const saveEntry = async () => {
    // Verifica se temos um usuário identificado — sem isso não dá para salvar corretamente.
    if (!userId) {
      Alert.alert("Erro", "Usuário não identificado");
      return;
    }

    // Não deixamos salvar anotações vazias: pede ao menos título ou conteúdo.
    if (!title.trim() && !content.trim()) {
      Alert.alert("Aviso", "Adicione um título ou conteúdo para salvar");
      return;
    }

    setLoading(true);
    try {
      // Montamos o objeto que será enviado ao Supabase.
      // Se editingEntry?.id existir, upsert vai atualizar; caso contrário cria novo registro.
      const payload = {
        id: editingEntry?.id,
        user_id: userId,
        title: title.trim(),
        content: content.trim(),
        media_url: media,
      };

      // upsert insere ou atualiza a linha na tabela "entries"
      const { error } = await supabase.from("entries").upsert(payload);
      
      if (error) {
        // Se houve erro, mostramos ao usuário
        Alert.alert("Erro", error.message);
      } else {
        // Se deu certo, voltamos para a tela anterior
        navigation.goBack();
      }
    } catch (error) {
      // Erro genérico ao salvar
      Alert.alert("Erro", "Falha ao salvar a anotação");
    } finally {
      setLoading(false);
    }
  };

  // Abaixo está a estrutura visual (UI) da tela.
  // Comentários explicam blocos importantes para quem está começando.
  return (
    // KeyboardAvoidingView ajuda a evitar que o teclado cubra os campos, especialmente no iOS.
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ScrollView permite rolar o conteúdo caso a tela seja pequena */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header: botão voltar, título da tela e botão salvar */}
        <View style={styles.header}>
          {/* Botão voltar: chama navigation.goBack() para retornar */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Título que muda dependendo se estamos editando ou criando */}
          <Text style={styles.headerTitle}>
            {editingEntry ? "Editar Anotação" : "Nova Anotação"}
          </Text>

          {/* Botão Salvar: desabilitado e com texto diferente enquanto loading */}
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

        {/* Formulário com campos de título, conteúdo e controles de mídia */}
        <View style={styles.form}>
          {/* Campo de título: texto curto, limite de 100 caracteres */}
          <TextInput
            placeholder="Título"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle} // toda alteração atualiza o estado `title`
            style={styles.titleInput}
            maxLength={100}
          />
          
          {/* Campo de conteúdo: multilinha, limite de 2000 caracteres */}
          <TextInput
            placeholder="Conteúdo da anotação..."
            placeholderTextColor="#666"
            value={content}
            onChangeText={setContent} // atualiza o estado `content`
            style={styles.contentInput}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />
          
          {/* Contadores simples que mostram quantos caracteres já foram digitados */}
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {title.length}/100
            </Text>
            <Text style={styles.counterText}>
              {content.length}/2000
            </Text>
          </View>

          {/* Se há uma mídia selecionada, mostramos pré-visualização com opção de remover */}
          {media && (
            <View style={styles.mediaContainer}>
              {/* A tag Image exibe a imagem a partir da URL pública */}
              <Image source={{ uri: media }} style={styles.mediaPreview} />
              {/* Botão para remover apenas a referência local da mídia */}
              <TouchableOpacity style={styles.removeMediaButton} onPress={removeMedia}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          {/* Botão para abrir a galeria e adicionar/alterar mídia.
              Desabilitado enquanto estiver carregando operações. */}
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

// Estilos visuais: organizam cores, tamanhos e espaçamentos.
// Não é necessário entender tudo aqui para usar o componente, mas serve para deixar a tela bonita.
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
