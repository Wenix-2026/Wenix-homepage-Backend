<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/tools')]
class ToolController extends AbstractController
{
    #[Route('/', name: 'app_tools_index')]
    public function index(): Response
    {
        return $this->render('tools/index.html.twig', [
            'pageTitle' => 'Nástroje',
            'sectionIcon' => 'bx bx-wrench',
        ]);
    }

    #[Route('/cron', name: 'app_tools_cron')]
    public function cron(): Response
    {
        return $this->render('tools/cron.html.twig', [
            'pageTitle' => 'Cron úlohy',
        ]);
    }
}
