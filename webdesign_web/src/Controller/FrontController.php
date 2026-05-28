<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class FrontController extends AbstractController
{
    #[Route('/', name: 'app_front_home')]
    public function index(): Response
    {
        return $this->render('front/home.html.twig');
    }

    #[Route('/cookies', name: 'app_cookie_policy')]
    public function cookiePolicy(): Response
    {
        return $this->render('front/cookies.html.twig');
    }

    #[Route('/privacy', name: 'app_privacy_policy')]
    public function privacyPolicy(): Response
    {
        return $this->render('front/privacy.html.twig');
    }
}
