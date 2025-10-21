import { useState } from "react";
// Componentes visuais e utilitários do React Native usados na tela
import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
// Cliente do Supabase para autenticação (login/logout)
import { supabase } from "../supabase/supabaseClient";

/*
  Tela de Login:
  - Permite que o usuário entre na conta usando email e senha.
  - Ao logar com sucesso, substitui a pilha de navegação pela tela "Home".
  - Comentários abaixo explicam cada parte para alguém leigo entender o que está acontecendo.
*/
export default function LoginScreen({ navigation }: any) {
  // Estados que guardam os valores digitados nos campos e se há uma operação em andamento.
  // email: o e-mail digitado pelo usuário
  const [email, setEmail] = useState("");
  // senha: a senha digitada (no código anterior chamada 'senha' em português)
  const [senha, setSenha] = useState("");
  // loading: indica quando estamos tentando fazer login (para desabilitar botão e mostrar texto)
  const [loading, setLoading] = useState(false);

  /*
    Função que tenta autenticar o usuário no Supabase usando email e senha.
    Passo a passo:
    1. Valida se ambos os campos foram preenchidos.
    2. Seta `loading` para true para bloquear múltiplos cliques enquanto a requisição roda.
    3. Chama supabase.auth.signInWithPassword com os dados fornecidos.
    4. Se ocorrer erro, mostra um alerta com a mensagem.
    5. Se sucesso, navega para a tela "Home" substituindo a pilha (navigation.replace).
  */
  const handleLogin = async () => {
    // Validação simples: evita enviar formulário vazio
    if (!email || !senha) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    // Chamada ao Supabase para autenticar com email e senha
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    
    if (error) {
      // Mostra mensagem de erro amigável se a autenticação falhar
      Alert.alert("Erro", error.message);
    } else {
      // Se login bem-sucedido, substitui a tela atual pela Home (impede voltar para o login)
      navigation.replace("Home");
    }
  };

  // Estrutura visual da tela (UI)
  return (
    // KeyboardAvoidingView ajusta o layout quando o teclado aparece (iOS/Android)
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Container central que segura os campos e botões */}
      <View style={styles.content}>
        {/* Título e subtítulo explicam ao usuário o propósito da tela */}
        <Text style={styles.title}>Bem-vindo</Text>
        <Text style={styles.subtitle}>Faça login na sua conta</Text>
        
        {/* Campo de email:
            - placeholder: texto que aparece quando o campo está vazio
            - keyboardType: mostra teclado otimizado para digitar e-mail
            - autoCapitalize/autoComplete: ajudam na entrada correta do e-mail
            - onChangeText: atualiza o estado `email` sempre que o usuário digita
        */}
        <TextInput
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        
        {/* Campo de senha:
            - secureTextEntry: esconde os caracteres digitados
            - onChangeText: atualiza o estado `senha`
        */}
        <TextInput
          placeholder="Senha"
          placeholderTextColor="#888"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          style={styles.input}
          autoCapitalize="none"
        />
        
        {/* Botão principal de Entrar:
            - Enquanto `loading` for true, o botão é desabilitado e mostra "Entrando..."
            - Ao pressionar chama handleLogin()
        */}
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Entrando..." : "Entrar"}
          </Text>
        </TouchableOpacity>
        
        {/* Botão secundário para ir à tela de registro:
            - navigation.navigate("Register") abre a tela de criação de conta
        */}
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.secondaryButtonText}>Criar nova conta</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Estilos visuais: definem cores, espaçamentos e aparência dos elementos.
// Não é necessário saber CSS profundamente para entender a função — estes objetos apenas tornam a tela apresentável.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "System",
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 40,
    textAlign: "center",
    fontFamily: "System",
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#333",
    padding: 16,
    marginBottom: 20,
    borderRadius: 16,
    fontSize: 16,
    color: "#ffffff",
    fontFamily: "System",
  },
  button: {
    backgroundColor: "#6366f1",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: "#4f46e5",
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "System",
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333",
  },
  secondaryButtonText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "System",
  },
});
