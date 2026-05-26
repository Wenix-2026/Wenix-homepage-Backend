<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/admin')]
class HomeController extends AbstractController
{
    /**
     * Admin dashboard home (Dostupný na: /admin)
     */
    #[Route('/', name: 'app_home_index')]
    public function index(): Response
    {
        $mockData = [
            'categories' => [
                ['id' => 1, 'name' => 'Produkty', 'slug' => 'products', 'icon_class' => 'bx bx-barcode-alt', 'total_count' => 30],
                ['id' => 2, 'name' => 'Expedice', 'slug' => 'shipping', 'icon_class' => 'bx bx-truck', 'total_count' => 2],
                ['id' => 3, 'name' => 'Pokladna a sklad', 'slug' => 'pos-cashier', 'icon_class' => 'bx bx-store-alt', 'total_count' => 9],
                ['id' => 4, 'name' => 'Doprava a platba', 'slug' => 'delivery', 'icon_class' => 'bx bx-credit-card', 'total_count' => 12],
                ['id' => 5, 'name' => 'Marketing', 'slug' => 'marketing', 'icon_class' => 'bx bx-bullseye', 'total_count' => 17],
                ['id' => 6, 'name' => 'E-mail marketing', 'slug' => 'email-marketing', 'icon_class' => 'bx bx-envelope-open', 'total_count' => 2],
                ['id' => 7, 'name' => 'Analytics', 'slug' => 'analytics', 'icon_class' => 'bx bx-bar-chart-alt', 'total_count' => 7],
                ['id' => 8, 'name' => 'Bezpečnost', 'slug' => 'security', 'icon_class' => 'bx bx-shield', 'total_count' => 8],
            ],
            'recommended_modules' => [
                ['id' => 1, 'name' => 'CDN', 'description' => 'Rychlejší načítání a optimalizace mediálního obsahu e-shopu. CDN pro obrázky a videa s neomezeným přenosem dat.', 'icon_class' => 'bx bx-cloud', 'badge_class' => 'bg-red-500 text-white', 'is_active' => true, 'is_recommended' => true],
                ['id' => 2, 'name' => 'Autopilot', 'description' => 'Využijte pokročilé automatizace procesů pro práci s objednávkami. Upomínky k nezaplaceným objednávkám, změny stavů.', 'icon_class' => 'bx bx-bot', 'badge_class' => 'bg-blue-500 text-white', 'is_active' => true, 'is_recommended' => true],
                ['id' => 3, 'name' => 'AI Chatbot', 'description' => 'Chytrý asistent pro podporu zákazníků 24/7', 'icon_class' => 'bx bx-bot', 'badge_class' => 'bg-purple-500 text-white', 'is_active' => true, 'is_recommended' => true],
                ['id' => 4, 'name' => 'Newsletter', 'description' => 'Vytvářejte a odesílejte e-mailové kampaně přímo z panelu', 'icon_class' => 'bx bx-paper-plane', 'badge_class' => 'bg-blue-500 text-white', 'is_active' => true, 'is_recommended' => true],
                ['id' => 5, 'name' => 'Sociální sítě', 'description' => 'Správa a publikování obsahu na sociálních sítích', 'icon_class' => 'bx bxl-facebook', 'badge_class' => 'bg-blue-500 text-white', 'is_active' => true, 'is_recommended' => true],
                ['id' => 6, 'name' => 'SEO nástroje', 'description' => 'Zlepšete viditelnost v vyhledávačích a ranking', 'icon_class' => 'bx bx-search', 'badge_class' => 'bg-green-500 text-white', 'is_active' => true, 'is_recommended' => true],
            ],
        ];

        return $this->render('home/index.html.twig', [
            'categories' => $mockData['categories'],
            'recommended_modules' => $mockData['recommended_modules'],
        ]);
    }

    /**
     * API endpoint pro headless frontend (Dostupný na: /admin/api/v1/modules)
     */
    #[Route('/api/v1/modules', name: 'api_modules_index', methods: ['GET'])]
    public function apiModules(): JsonResponse
    {
        // ... toto klidně může zůstat stejné jako doteď ...
        return $this->json([]);
    }
}
