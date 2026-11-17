# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

```
gabarito-app-front
├─ app
│  ├─ (aplicador)
│  │  ├─ _layout.tsx
│  │  ├─ aplicarProva.tsx
│  │  └─ saed.tsx
│  ├─ (auth)
│  │  ├─ index.tsx
│  │  └─ login.tsx
│  ├─ (generico)
│  │  └─ sincronizador.tsx
│  ├─ (professor)
│  │  ├─ _layout.tsx
│  │  ├─ home.tsx
│  │  └─ scanner.tsx
│  └─ _layout.tsx
├─ app.json
├─ eas.json
├─ package-lock.json
├─ package.json
├─ src
│  ├─ assets
│  │  └─ images
│  │     ├─ icon_splash.png
│  │     ├─ logo_icon.png
│  │     └─ logo_icon2.png
│  ├─ components
│  │  ├─ BottomNav.tsx
│  │  ├─ CameraFrame.tsx
│  │  └─ SyncModal.tsx
│  ├─ contexts
│  │  └─ AuthContext.tsx
│  ├─ database
│  │  ├─ app.db
│  │  ├─ database.ts
│  │  ├─ migrations.ts
│  │  └─ services
│  │     ├─ corrigirProvaRepository.ts
│  │     ├─ leitorGabaritoRepository.ts
│  │     ├─ provaRepository.ts
│  │     ├─ respostaRepository.ts
│  │     ├─ salvarAvaliacao.ts
│  │     └─ sincronizarGabaritoRepository.ts
│  ├─ features
│  │  └─ leitor-gabarito
│  │     ├─ components
│  │     │  ├─ BannerRede.tsx
│  │     │  ├─ BolinhaResposta.tsx
│  │     │  ├─ CardResultado.tsx
│  │     │  └─ ItemFila.tsx
│  │     ├─ hooks
│  │     │  └─ useLeitorGabarito.ts
│  │     ├─ screens
│  │     │  ├─ InicioScreen.tsx
│  │     │  ├─ PreviewScreen.tsx
│  │     │  ├─ ProgressoScreen.tsx
│  │     │  ├─ QRCodeScreen.tsx
│  │     │  └─ SucessoScreen.tsx
│  │     ├─ services
│  │     │  ├─ compararGabarito.ts
│  │     │  └─ leitorGabaritoApi.ts
│  │     ├─ styles
│  │     │  ├─ inicio.styles.ts
│  │     │  ├─ progresso.styles.ts
│  │     │  └─ scanner.styles.ts
│  │     ├─ types
│  │     │  └─ leitorGabarito.types.ts
│  │     └─ utils
│  │        └─ compararRespostas.ts
│  ├─ services
│  │  ├─ correcaoGabarito.ts
│  │  ├─ listaProvaService.ts
│  │  ├─ loginService.ts
│  │  ├─ socketServer.ts
│  │  └─ socketiClient.ts
│  ├─ styles
│  │  ├─ aplicaProva.styles.ts
│  │  └─ sincronizador.style.ts
│  ├─ ts
│  │  ├─ useAplicarProva.ts
│  │  ├─ useBottonNav.ts
│  │  ├─ useLogin.ts
│  │  ├─ useSaed.ts
│  │  ├─ useSincronizador.ts
│  │  └─ useSyncModal.ts
│  └─ types
│     └─ user.ts
└─ tsconfig.json

```
