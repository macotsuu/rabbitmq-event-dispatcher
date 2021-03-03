import pkg from './package.json'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

export default [
    {
        input: 'src/index.ts',
        external: [Object.keys(pkg.dependencies) || {}],
        plugins: [
            typescript(),
            terser()
        ],
        output: {
            file: pkg.main, 
            format: 'cjs'
        },
    }
]