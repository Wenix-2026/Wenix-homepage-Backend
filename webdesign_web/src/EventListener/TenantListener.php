<?php
// src/EventListener/TenantListener.php

namespace App\EventListener;

use App\Repository\Master\TenantRepository;
use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;

class TenantListener
{
    private const PUBLIC_PREFIXES = [
        '/_wdt',
        '/_profiler',
        // '/login',
        '/logout',
    ];

    public function __construct(
        private Connection $tenantConnection,
        private TenantRepository $tenantRepository,
        private string $projectDir,  // ← přidej
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
        $params = $this->tenantConnection->getParams();
        $newPath = $this->projectDir . '/var/' . $tenant->getDbName() . '.db';
        $params['path'] = $newPath;

        $this->tenantConnection->close();
        $this->tenantConnection->__construct(
            $params,
            $this->tenantConnection->getDriver(),
            $this->tenantConnection->getConfiguration(),
        );

        // DEBUG
        try {
            $users = $this->tenantConnection->fetchAllAssociative(
                "SELECT email, roles FROM user LIMIT 5"
            );
            file_put_contents(__DIR__ . '/../../var/debug_tenant.txt',
                "Path: " . $newPath . "\n" .
                "Users: " . json_encode($users) . "\n"
            );
        } catch (\Exception $e) {
            file_put_contents(__DIR__ . '/../../var/debug_tenant.txt',
                "Path: " . $newPath . "\n" .
                "Error: " . $e->getMessage() . "\n"
            );
        }

        $event->getRequest()->attributes->set('_tenant', $tenant);
    }
}
