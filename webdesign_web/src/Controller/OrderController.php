<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/orders')]
class OrderController extends AbstractController
{
    #[Route('/', name: 'app_orders_index')]
    public function index(): Response
    {
        return $this->render('orders/index.html.twig', [
            'pageTitle' => 'Správa objednávek',
            'sectionIcon' => 'bx bx-cart-alt',
        ]);
    }

    #[Route('/{id}', name: 'app_orders_show', requirements: ['id' => '\d+'])]
    public function show(int $id): Response
    {
        return $this->render('orders/show.html.twig', [
            'orderId' => $id,
            'pageTitle' => 'Objednávka #' . $id,
        ]);
    }
}
