# Configuração de Email para Suporte

Para que o sistema de suporte envie emails automaticamente, você precisa configurar as seguintes variáveis de ambiente:

## Variáveis Obrigatórias

### `SUPPORT_ADMIN_EMAIL`
- **Descrição**: Email onde todas as mensagens de suporte serão enviadas
- **Valor padrão**: `clear.stock.pt@gmail.com`
- **Exemplo**: `SUPPORT_ADMIN_EMAIL=clear.stock.pt@gmail.com`

### `RESEND_API_KEY`
- **Descrição**: Chave API do Resend para envio de emails
- **Como obter**: 
  1. Acesse https://resend.com
  2. Crie uma conta (gratuita)
  3. Vá em "API Keys" e crie uma nova chave
  4. Copie a chave e adicione ao `.env`
- **Exemplo**: `RESEND_API_KEY=re_xxxxxxxxxxxxx`

### `EMAIL_FROM` (Opcional)
- **Descrição**: Email remetente (deve ser verificado no Resend)
- **Valor padrão**: `no-reply@clearstok.app`
- **Nota**: Você precisa verificar este domínio/email no Resend antes de usar
- **Exemplo**: `EMAIL_FROM=no-reply@clearstok.app`

## Configuração no Resend

1. **Criar conta no Resend**: https://resend.com/signup
2. **Verificar domínio ou email**:
   - Vá em "Domains" para verificar um domínio completo
   - Ou use o email padrão do Resend para testes
3. **Criar API Key**:
   - Vá em "API Keys"
   - Clique em "Create API Key"
   - Copie a chave e adicione ao `.env`

## Exemplo de `.env`

```env
# Database
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url

# Support Email
SUPPORT_ADMIN_EMAIL=clear.stock.pt@gmail.com
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=no-reply@clearstok.app
```

## Nota Importante

Se `RESEND_API_KEY` não estiver configurado, o sistema ainda funcionará:
- As mensagens serão salvas no banco de dados
- Um aviso será logado no console
- O email não será enviado

Isso permite desenvolvimento local sem configurar email, mas em produção você deve sempre configurar o Resend.

