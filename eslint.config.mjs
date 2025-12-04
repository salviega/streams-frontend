import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'

const eslintConfig = defineConfig([
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		'.next/**',
		'out/**',
		'build/**',
		'next-env.d.ts'
	]),

	...nextVitals,
	...nextTs,

	{
		files: ['**/*.{mjs,cjs,js,jsx,ts,tsx}'],

		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				React: 'writable'
			}
		},

		plugins: {
			prettier,
			'simple-import-sort': simpleImportSort,
			'unused-imports': unusedImports
		},

		rules: {
			// General
			eqeqeq: ['warn', 'always'],

			'@typescript-eslint/no-unused-vars': 'off',

			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'warn',

			'unused-imports/no-unused-imports': 'warn',
			'unused-imports/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					args: 'after-used',
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_'
				}
			],

			'prettier/prettier': 'warn',

			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn'
		}
	}
])

export default eslintConfig
