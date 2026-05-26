<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/settings')]
class SettingController extends AbstractController
{
    #[Route('/', name: 'app_settings_index')]
    public function index(): Response
    {
        return $this->render('settings/index.html.twig', [
            'pageTitle' => 'Nastavení',
            'sectionIcon' => 'bx bx-cog',
        ]);
    }

    #[Route('/emails', name: 'app_settings_emails')]
    public function emails(): Response
    {
        return $this->render('settings/emails.html.twig', [
            'pageTitle' => 'E-mail nastavení',
        ]);
    }
}
