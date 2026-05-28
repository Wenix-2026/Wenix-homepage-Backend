<?php
namespace App\EventListener;

use App\Repository\Master\TenantRepository;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;

class TenantListener
{
    private const PUBLIC_PREFIXES = [
        '/_wdt',
        '/_profiler',
        '/cookies',
        '/privacy',
    ];

    public function __construct(
        private Connection $tenantConnection,
        private TenantRepository $tenantRepository,
        private EntityManagerInterface $tenantEm,
        private string $projectDir,
    ) {}

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) return;

        $path = $event->getRequest()->getPathInfo();

        foreach (self::PUBLIC_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix)) return;
        }

        $host   = $event->getRequest()->getHost();
        $tenant = $this->tenantRepository->findOneBy([
            'domain' => $host,
            'active' => true,
        ]);

        if (!$tenant) {
            $event->setResponse(new Response(
                '<html><body style="font-family:sans-serif;text-align:center;padding:50px">
                    <h1>Tenant nenalezen</h1>
                    <p>Tato doména není registrována v systému.</p>
                </body></html>',
                404
            ));
            return;
        }

        // Přepni tenant DB
        $dbPath = $this->projectDir . '/var/' . $tenant->getDbName() . '.db';
        $params = $this->tenantConnection->getParams();
        $params['path'] = $dbPath;

        $this->tenantConnection->close();
        $this->tenantConnection->__construct(
            $params,
            $this->tenantConnection->getDriver(),
            $this->tenantConnection->getConfiguration(),
        );

        // Automaticky vytvoř schéma pokud DB je nová/prázdná
        $this->ensureSchemaExists($dbPath);

        $event->getRequest()->attributes->set('_tenant', $tenant);
    }

    private function ensureSchemaExists(string $dbPath): void
    {
        try {
            // Rychlá kontrola — pokud tabulka existuje, skip
            $this->tenantConnection->fetchOne("SELECT 1 FROM user LIMIT 1");
        } catch (\Exception) {
            // Tabulka neexistuje — vytvoř schéma
            try {
                $schemaTool = new SchemaTool($this->tenantEm);
                $classes    = $this->tenantEm->getMetadataFactory()->getAllMetadata();
                $schemaTool->createSchema($classes);
            } catch (\Exception $e) {
                // Schéma již existuje nebo jiná chyba — ignoruj
            }
        }
    }
}
