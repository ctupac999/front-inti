export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad y Tratamiento de Datos</h1>
      <p className="text-sm text-gray-500 mb-8">Versión v1.0 — Última actualización: 19/05/2026</p>

      <div className="space-y-6 text-gray-700 leading-7">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Responsable del tratamiento</h2>
          <p>
            El responsable del tratamiento de los datos personales recabados a través de INTI es el titular de la plataforma.
            Para consultas de privacidad, podés escribir a: intitrueque@gmail.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Finalidades del tratamiento</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Crear y administrar cuentas de usuario.</li>
            <li>Permitir publicaciones, búsquedas y propuestas de trueque.</li>
            <li>Facilitar comunicación entre usuarios vinculada a intercambios.</li>
            <li>Enviar notificaciones operativas y correos transaccionales (registro, seguridad, gestión de cuenta).</li>
            <li>Prevenir fraude, abuso y usos indebidos de la plataforma.</li>
            <li>Mejorar funcionamiento, soporte técnico y seguridad del servicio.</li>
            <li>Enviar novedades, solo si el usuario lo autoriza expresamente.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Datos tratados</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Datos de identificación y contacto: nombre, apellido, email, teléfono (opcional).</li>
            <li>Datos de perfil y actividad: publicaciones, ubicaciones y propuestas de trueque.</li>
            <li>Datos técnicos y de seguridad: fecha/hora de acceso, eventos de autenticación y uso.</li>
            <li>Constancia de aceptación legal: versión aceptada, fecha y hora de aceptación.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Base legal</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Ejecución de la relación de servicio solicitada por el usuario.</li>
            <li>Consentimiento expreso del usuario (por ejemplo, para marketing opcional).</li>
            <li>Interés legítimo en seguridad, prevención de fraude y mejora del servicio.</li>
            <li>Cumplimiento de obligaciones legales aplicables.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Cesión y acceso de terceros</h2>
          <p>
            INTI no vende datos personales. Puede compartir información con proveedores tecnológicos estrictamente necesarios
            (hosting, correo transaccional, monitoreo técnico), bajo acuerdos de confidencialidad y protección de datos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Plazo de conservación</h2>
          <p>
            Los datos se conservan mientras la cuenta esté activa y por el tiempo necesario para cumplir finalidades legales,
            contractuales y de seguridad. Luego se eliminan o anonimiza su contenido cuando corresponda.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Derechos del usuario</h2>
          <p>Podés ejercer tus derechos de:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Acceso</li>
            <li>Rectificación</li>
            <li>Supresión</li>
            <li>Oposición</li>
            <li>Limitación del tratamiento</li>
            <li>Portabilidad (cuando aplique)</li>
            <li>Retiro del consentimiento otorgado</li>
          </ul>
          <p className="mt-2">Para ejercerlos, escribí a intitrueque@gmail.com.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Seguridad de la información</h2>
          <p>
            INTI aplica medidas razonables de seguridad técnicas y organizativas para proteger los datos frente a accesos no
            autorizados, pérdida, alteración o divulgación indebida.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Cookies y tecnologías similares</h2>
          <p>
            INTI puede utilizar cookies necesarias para autenticación, seguridad y funcionamiento del sitio. Si se incorporan
            cookies analíticas o de marketing, se solicitará consentimiento cuando corresponda.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">10. Cambios a esta política</h2>
          <p>
            Esta política puede actualizarse para reflejar cambios normativos o funcionales. La versión vigente será la
            publicada en esta página.
          </p>
        </section>
      </div>
    </div>
  )
}
