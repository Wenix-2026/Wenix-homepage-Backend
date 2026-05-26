<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/translations')]
class TranslationController extends AbstractController
{
    #[Route('/', name: 'app_translations_index')]
    public function index(): Response
    {
        return $this->render('translations/index.html.twig', [
            'pageTitle' => 'Překlady',
            'sectionIcon' => 'bx bx-language',
        ]);
    }

    #[Route('/strings', name: 'app_translations_strings')]
    public function strings(): Response
    {
        return $this->render('translations/strings.html.twig', [
            'pageTitle' => 'Řetězce',
        ]);
    }
}
