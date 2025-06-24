import setupApp from './utils/setupApp';

const PORT = process.env.PORT || 3000;

const app = setupApp();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
