<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/content')]
class ContentController extends AbstractController
{
    #[Route('/', name: 'app_content_index')]
    public function index(): Response
    {
        return $this->render('content/index.html.twig', [
            'pageTitle' => 'Správa obsahu',
            'sectionIcon' => 'bx bx-file',
        ]);
    }

    #[Route('/pages', name: 'app_content_pages')]
    public function pages(): Response
    {
        return $this->render('content/pages.html.twig', [
            'pageTitle' => 'Stránky',
        ]);
    }
}
