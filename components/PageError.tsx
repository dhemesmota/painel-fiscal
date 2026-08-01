export function PageError({ message }: { message?: string }) {
  return (
    <div className="data-error" role="alert">
      <strong>Não foi possível carregar seus dados agora.</strong>
      <p>
        {message ? `Detalhe: ${message}. ` : ''}
        Isso pode ser uma instabilidade temporária de conexão com o banco. Os números desta página
        não seriam confiáveis se mostrados — por isso nada foi exibido. Atualize a página em
        instantes; se persistir, os dados não foram perdidos, só não puderam ser lidos agora.
      </p>
    </div>
  );
}
