/** Workersでは`.wasm`をCloudflare Vite pluginがコンパイル済みのモジュールとして読み込む。 */
declare module "*.wasm" {
  const module: WebAssembly.Module;
  export default module;
}
