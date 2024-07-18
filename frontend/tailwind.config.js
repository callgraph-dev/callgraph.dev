/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}', './static/index.html', './dist/index.html'],
  theme: {
    extend: {
      animationDelay: {
        '1': '0.1s',
        '2': '0.2s',
        '3': '0.3s',
        '4': '0.4s',
        '5': '0.5s',
        '6': '0.6s',
        '7': '0.7s',
        '8': '0.8s',
        '9': '0.9s',
        '10': '1s',
        '11': '1.1s',
        '12': '1.2s',
        '13': '1.3s',
        '14': '1.4s',
      },      
      animation: {
        wiggle: 'rollColors 3s ease-in-out infinite',
      },      
      keyframes: {
        rollColors: {
          '0%, 100%': { 'background-color': 'rgb(203 213 225)'}, /* bg-slate-300 */
          '20%': { 'background-color': 'rgb(148 163 184)' }, /* bg-slate-400 */
          '40%': { 'background-color': 'rgb(100 116 139)' }, /* bg-slate-500 */
          '60%': { 'background-color': 'rgb(148 163 184)' }, /* bg-slate-500 */
          '80%': { 'background-color': 'rgb(203 213 225)' }, /* bg-slate-300 */
        }
      }
    },
  },
  plugins: [
    // Add a plugin to read the custom utilities
    function({ addUtilities, theme }) {
      const newUtilities = {};
      Object.entries(theme('animationDelay')).forEach(([key, value]) => {
        newUtilities[`.adelay-${key}`] = {
          animationDelay: value,
        };
      });
      addUtilities(newUtilities, ['responsive', 'hover']);
    },
  ],
}

