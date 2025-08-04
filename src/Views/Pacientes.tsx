const Pacientes: React.FC = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-cesunAzul-900">Pacientes</h2>
      <table className="w-full mt-4 bg-white rounded-lg shadow-md">
        <thead>
          <tr className="bg-withe -700 text-black">
            <th className="p-4">ID</th>
            <th className="p-4">Nombre</th>
            <th className="p-4">Correo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-4">1</td>
            <td className="p-4">Ejemplo</td>
            <td className="p-4">ejemplo@correo.com</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Pacientes;
