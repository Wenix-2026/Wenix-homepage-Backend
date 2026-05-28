<?php
namespace App\Controller\Api;

use App\Entity\Tenant\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/superadmin', name: 'api_superadmin_')]
class SuperadminController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private string $superadminToken,
    ) {}

    // Ověření tokenu jako privátní metoda
    private function authorize(Request $request): bool
    {
        $token = $request->headers->get('X-AUTH-TOKEN');
        return hash_equals($this->superadminToken, (string) $token);
    }

    // Základní status e-shopu
    #[Route('/status', name: 'status', methods: ['GET'])]
    public function status(Request $request): JsonResponse
    {
        if (!$this->authorize($request)) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        return $this->json([
            'status'      => 'online',
            'version'     => '1.0.0',
            'php_version' => PHP_VERSION,
            'timestamp'   => (new \DateTimeImmutable())->format('c'),
        ]);
    }

    // Statistiky e-shopu
    #[Route('/stats', name: 'stats', methods: ['GET'])]
    public function stats(Request $request): JsonResponse
    {
        if (!$this->authorize($request)) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $userCount = $this->em->getRepository(User::class)->count([]);

        return $this->json([
            'users'     => $userCount,
            'timestamp' => (new \DateTimeImmutable())->format('c'),
        ]);
    }

    // Vzdálené vypnutí/zapnutí administrace
    #[Route('/admin-toggle', name: 'admin_toggle', methods: ['POST'])]
    public function adminToggle(Request $request): JsonResponse
    {
        if (!$this->authorize($request)) {
            return $this->json(['error' => 'Unauthorized'], 401);
        }

        $data    = json_decode($request->getContent(), true);
        $enabled = (bool) ($data['enabled'] ?? true);

        // Ulož stav do cache/souboru
        file_put_contents(
            __DIR__ . '/../../../var/admin_enabled.flag',
            $enabled ? '1' : '0'
        );

        return $this->json([
            'admin_enabled' => $enabled,
            'message'       => 'Admin ' . ($enabled ? 'zapnut' : 'vypnut'),
        ]);
    }
}
