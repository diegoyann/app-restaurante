# Data Model: Estado de recuperação de sessão

| Estado | Significado | Transição permitida |
|---|---|---|
| validada | Perfil e permissões carregados | recuperando, inválida |
| recuperando | Nova validação/renovação em curso | validada ou falha transitória |
| falha transitória | API/rede indisponível, sessão preservada | recuperando ou validada |
| inválida | Não há sessão ou ela foi rejeitada | login ou validada após autenticação |

Não há persistência ou migração.
