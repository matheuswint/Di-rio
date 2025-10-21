import { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
// Cliente do Supabase: usado para criar conta (signup)
import { supabase } from "../supabase/supabaseClient";

/*
  RegisterScreen.tsx
  ------------------
  Nesta tela o usuário cria uma nova conta usando email e senha.
  Vou explicar cada parte com comentários para que alguém leigo consiga entender.
*/
export default function RegisterScreen({ navigation }: any) {
  // Estados: são "caixinhas" que guardam valores que mudam enquanto a tela está aberta.
  // email: guarda o que o usuário digita no campo de e-mail.
  const [email, setEmail] = useState("");
  // senha: guarda o que o usuário digita no campo de senha.
  const [senha, setSenha] = useState("");
  // loading: indica se estamos aguardando a resposta do servidor (para bloquear botões e mostrar feedback).
  const [loading, setLoading] = useState(false);

  /*
    handleRegister: função acionada quando o usuário toca no botão "Cadastrar".
    Passo a passo (explicado de forma simples):
    1) Verifica se os campos não estão vazios — evita chamadas desnecessárias ao servidor.
    2) Mostra que estamos carregando (loading = true).
    3) Chama o Supabase para criar a conta com email e senha.
    4) Se houver erro, mostramos uma mensagem amigável.
    5) Se der certo, informamos sucesso e voltamos para a tela de Login.
  */
  const handleRegister = async () => {
    // Validação básica: campo vazio não é permitido
    if (!email || !senha) {
      // Alert é uma caixa de diálogo simples para avisos
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    // Marcamos que a operação começou
    setLoading(true);

    // Chamamos o Supabase para criar o usuário.
    // signUp devolve um objeto que pode conter 'error' se algo deu errado.
    const { error } = await supabase.auth.signUp({ email, password: senha });

    // Operação terminou — tiramos o estado de carregamento
    setLoading(false);
    
    if (error) {
      // Se o Supabase retornou erro, mostramos ao usuário a mensagem recebida.
      Alert.alert("Erro", error.message);
    } else {
      // Sucesso: avisamos o usuário que o cadastro foi realizado e pedimos para verificar o e-mail.
      Alert.alert("Sucesso", "Cadastro realizado! Verifique seu email.");
      // Voltamos para a tela de Login (goBack) — o usuário pode então confirmar o email e entrar.
      navigation.goBack();
    }
  };

  // Abaixo está a interface visual (UI) da tela.
  // Cada componente tem comentários para explicar o papel no layout.
  return (
    // KeyboardAvoidingView: ajusta a tela quando o teclado aparece (especialmente no iOS)
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* View central que contém os campos e botões */}
      <View style={styles.content}>
        {/* Título da tela */}
        <Text style={styles.title}>Criar Conta</Text>
        
        {/* Campo de email:
            - placeholder: texto que aparece enquanto não digita nada
            - keyboardType: traz teclado adequado para e-mail
            - onChangeText: toda vez que o usuário digita, atualizamos o estado `email`
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
            - secureTextEntry: esconde os caracteres para privacidade
            - onChangeText: atualiza o estado `senha` com o que foi digitado
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
        
        {/* Botão principal:
            - Enquanto loading for true, o botão é desabilitado para evitar cliques repetidos.
            - Ao tocar chama handleRegister().
        */}
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Text>
        </TouchableOpacity>
        
        {/* Botão secundário para voltar ao Login:
            - navigation.goBack() retorna para a tela anterior (Login).
        */}
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Voltar para Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Estilos: controles de aparência (cores, tamanhos, espaçamento).
// Não é necessário entender todas as propriedades agora — elas apenas deixam a tela alinhada e bonita.
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
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
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
