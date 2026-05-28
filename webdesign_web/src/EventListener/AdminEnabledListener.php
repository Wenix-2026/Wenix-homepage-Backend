<?php
namespace App\EventListener;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;

class AdminEnabledListener
{
    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) return;

        $path = $event->getRequest()->getPathInfo();

        // Kontroluj pouze /admin cesty, ne API
        if (!str_starts_with($path, '/admin')) return;

        $flagFile = __DIR__ . '/../../var/admin_enabled.flag';
        $enabled  = !file_exists($flagFile) || file_get_contents($flagFile) === '1';

        if (!$enabled) {
            $event->setResponse(new JsonResponse(
                ['error' => 'Administrace je dočasně vypnutá.'],
                503
            ));
        }
    }
}
