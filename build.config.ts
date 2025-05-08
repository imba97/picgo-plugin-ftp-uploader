import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index'
  ],
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
    json: {
      compact: true,
      namedExports: false,
      preferConst: false
    },
    commonjs: {
      requireReturnsDefault: 'auto'
    },
    esbuild: {
      format: 'cjs'
    },
    output: {
      format: 'cjs',
      exports: 'auto'
    }
  },
  clean: true,
  declaration: true
})
