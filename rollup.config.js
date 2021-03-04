import pkg from './package.json'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

export default [
    {
        input: 'src/index.ts',
        output: {
            file: pkg.main, 
            format: 'cjs'
        },
        external: ['amqplib', 'uuid'],
        plugins: [
            typescript(),
            terser()
        ],
    }
]