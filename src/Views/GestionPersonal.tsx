const GestionPersonal: React.FC = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-cesunAzul-900">
        Gestión del Personal
      </h2>
      <table className="w-full mt-4 bg-white rounded-lg shadow-md">
        <thead>
          <tr className="bg-cesunAzul-700 text-white">
            <th className="p-4">ID</th>
            <th className="p-4">Nombre</th>
            <th className="p-4">Rol</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-4">1</td>
            <td className="p-4">Ejemplo</td>
            <td className="p-4">Doctor</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default GestionPersonal;
